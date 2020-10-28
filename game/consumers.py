import asyncio
import json
from django.contrib.auth import get_user_model
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer

from user_profile.models import UserProfile
from .models import GameRoom, Player
from .helper import Card, PlayerServer, GameServer, Deck, CustomEncoder

User = get_user_model()


class GameRoomConsumer(AsyncConsumer):
    """
        A Consumer which will consume (handle) events related to Game Room
    """

    async def websocket_connect(self, event):
        self.me = self.scope['user']

        self.unique_id = self.scope['url_route']['kwargs']['unique_id']

        self.game_type = int(self.scope['url_route']['kwargs']['game_type'])

        self.user_profile_obj = await self.get_user_profile_obj()

        league = None
        if self.game_type == GameServer.PUBLIC:
            league = self.user_profile_obj.current_league

        self.game_room_id = f"game_room_{self.unique_id}"

        self.player_server_obj = PlayerServer(username=self.me.username)

        self.game = GameServer.create_new_game(unique_id=self.unique_id, player=self.player_server_obj, game_type=self.game_type, league=league)

        if self.game is None:
            # Connection is rejected because this room is already full.
            return

        await self.channel_layer.group_add(
            self.game_room_id,
            self.channel_name
        )
        await self.send({
            "type": "websocket.accept"
        })

    async def websocket_receive(self, event):
        front_text = event.get('text', None)
        forced_draw_data = None  # If some player had to draw cards due to DRAW_TWO or WILD_FOUR.
        voluntary_draw_data = None  # When player voluntary drew a card.
        won_data = None  # When player has played all his cards.
        caught_data = None  # When a player didn't call uno and got caught. Stores cards drawn by that player.
        time_out_data = None  # When a player has exhausted his/her limit to play a card.
        if front_text:
            loaded_dict_data = json.loads(front_text)
            type_of_event = loaded_dict_data['type']
            text_of_event = loaded_dict_data['text']

            if type_of_event == "start.game":
                # print(f"Before Broadcasting: Going to call start.game")
                self.game.start_game()

                # This can be called by Friend Game only.
                if self.game.game_type == GameServer.FRIEND:
                    GameServer.AVAILABLE_FRIEND_GAMES.remove(self.game)
                if self.game.game_type == GameServer.PUBLIC:
                    GameServer.AVAILABLE_PUBLIC_GAMES.remove(self.game)
            elif type_of_event == "end.game":
                self.game.end_game()
                # await self.set_is_game_running_false()
            elif type_of_event == "play.card":
                client_data = text_of_event['data']
                server_data = {
                    "username": self.me.username,
                }
                returned_data = None
                if self.game.is_valid_play_move(client_data=client_data, server_data=server_data):
                    returned_data = self.game.play_card(client_data=client_data)
                    if returned_data:
                        if returned_data['status'] == "won":
                            won_data = returned_data
                            winner_username = won_data['username']
                            winner_score = int(won_data['score'])
                            if winner_score >= GameServer.WINNING_SCORE:
                                text_of_event['status'] = "won_game"
                                type_of_event = "won_game"

                                await self.handle_winning_game(winner_username=winner_username)

                                for loser_username in self.game.player_usernames:
                                    if loser_username != winner_username:
                                        await self.handle_losing_game(loser_username=loser_username)

                                # await self.set_is_game_running_false()

                                print(f"End Game. {winner_username} has scored winning points.")
                            else:
                                text_of_event['status'] = "won_round"
                                type_of_event = "won_round"

                                await self.handle_winning_round(winner_username=winner_username)

                                print(f"This round ended. Get ready for next round.")

                        elif returned_data['status'] == "skipped":
                            forced_draw_data = returned_data
                else:
                    # Handle Cheating
                    pass
            elif type_of_event == "voluntary_draw_card":  # When current player clicked on deck to draw the card.
                client_data = text_of_event['data']
                server_data = {
                    "username": self.me.username,
                }
                if self.game.is_valid_draw_move(client_data=client_data, server_data=server_data):
                    voluntary_draw_data = self.game.draw_card()
                else:
                    # Handle Cheating
                    pass
            elif type_of_event == "keep.card":  # Player kept the card after drawing.
                client_data = text_of_event['data']
                server_data = {
                    "username": self.me.username,
                }
                # Note: Here is_valid_draw_move will work fine to check if this is valid person.
                if self.game.is_valid_draw_move(client_data=client_data, server_data=server_data):
                    self.game.keep_card()
            elif type_of_event == "call.uno":  # Player called UNO.
                client_data = text_of_event['data']
                server_data = {
                    "username": self.me.username,
                }
                # If this player can call UNO.
                if self.game.can_call_uno(client_data=client_data, server_data=server_data):
                    self.game.call_uno(client_data=client_data)
                else:
                    text_of_event['status'] = "failed_call_uno"
                    print(f"Cannot call UNO!")
            elif type_of_event == "catch.player":  # When someone catches a player who forgot to say UNO!
                client_data = text_of_event['data']
                server_previous_player = self.game.get_previous_player()
                if server_previous_player is not None:
                    server_data = {
                        "caught": server_previous_player.username,
                        "catcher": self.me.username,
                    }
                    if self.game.is_valid_catch(client_data=client_data, server_data=server_data):
                        caught_data = self.game.catch_player()
                    else:
                        text_of_event['status'] = "failed_catch_player"
                        print("Cannot catch.")
                else:  # No one has played any card yet.
                    text_of_event['status'] = "failed_catch_player"
                    print("Cannot catch.")
            elif type_of_event == "time.out":
                client_data = text_of_event['data']
                server_data = {
                    "username": self.me.username,
                }
                if self.game.can_time_out(client_data=client_data, server_data=server_data):
                    time_out_data = self.game.time_out()

            if self.game is not None:
                game_data = json.dumps(self.game.prepare_client_data(), cls=CustomEncoder)
            else:
                game_data = None

            response = {
                "status": text_of_event['status'],
                "message": text_of_event['message'],
                "data": text_of_event['data'],
                "gameData": game_data,
            }

            if type_of_event == "won_game":
                self.game.end_game()

            if time_out_data:
                extra_data = {
                    "timeOutData": time_out_data,
                }
                response.update(extra_data)

            if caught_data:
                extra_data = {
                    "caughtData": caught_data,
                }
                response.update(extra_data)

            if won_data:
                extra_data = {
                    "wonData": won_data,
                }
                response.update(extra_data)

            if voluntary_draw_data:
                extra_data = {
                    "voluntaryDrawData": voluntary_draw_data,
                }
                response.update(extra_data)

            if forced_draw_data:
                extra_data = {
                    "forcedDrawData": forced_draw_data,
                }
                response.update(extra_data)
                response['status'] = "forced_draw_card"
                type_of_event = "forced_draw_card"

            await self.channel_layer.group_send(
                self.game_room_id,
                {
                    "type": type_of_event,
                    "text": json.dumps(response)
                }
            )

            # TODO: Trying match making.
            if type_of_event == "user.new":
                if self.game.game_type == GameServer.FRIEND:
                    if self.game.get_count_of_players() == 10:
                        GameServer.AVAILABLE_FRIEND_GAMES.remove(self.game)
                if self.game.game_type == GameServer.PUBLIC:
                    count = self.game.get_count_of_players()
                    print("Count so far:", count)
                    if count == GameServer.PUBLIC_ROOM_LIMIT:
                        pass
                        # await asyncio.sleep(2)
                        # print("CHANGING SCENE!.")
                        # change_scene_response = {
                        #     "status": "change_scene",
                        #     "message": "Scene Changed",
                        #     "data": {
                        #         "sceneNumber": 2,
                        #     }
                        # }
                        # await self.channel_layer.group_send(
                        #     self.game_room_id,
                        #     {
                        #         "type": "change.scene",
                        #         "text": json.dumps(change_scene_response)
                        #     }
                        # )

                        # print("Wait for 2 seconds")
                        # await asyncio.sleep(2)
                        # print("2 seconds over")
                        # print("Starting Public Game.")
                        # self.game.start_game()
                        # if self.game.game_type == GameServer.PUBLIC:
                        #     GameServer.AVAILABLE_PUBLIC_GAMES.remove(self.game)
                        # public_response = {
                        #     "status": "start_game",
                        #     "message": "Public Game has been started.",
                        #     "data": text_of_event['data'],
                        #     "gameData": json.dumps(self.game.prepare_client_data(), cls=CustomEncoder),
                        # }
                        # await self.channel_layer.group_send(
                        #     self.game_room_id,
                        #     {
                        #         "type": "start.game",
                        #         "text": json.dumps(public_response)
                        #     }
                        # )
                        # print("Started Public Game.")

    async def time_out(self, event):
        text = json.loads(event['text'])
        data = text['data']
        time_out_data = text['timeOutData']
        if data['username'] != self.me.username:
            time_out_data['drawnCards'] = []
        response = {
            "status": text['status'],
            "message": text['message'],
            "data": text['data'],
            "gameData": text['gameData'],
            "timeOutData": time_out_data,
        }
        await self.send({
            "type": "websocket.send",
            "text": json.dumps(response),
        })

    async def change_scene(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def update_current_player(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def catch_player(self, event):
        text = json.loads(event['text'])
        data = text['data']
        status = text['status']
        if status == "failed_catch_player":
            # If catch_player failed, send only to player who called catch_player
            if data['catcher'] == self.me.username:
                await self.send({
                    "type": "websocket.send",
                    "text": event['text']
                })
                return
        else:
            # If catcher successfully caught a player.
            caught_data = text['caughtData']
            if data['caught'] != self.me.username:
                caught_data['drawnCards'] = []
            response = {
                "status": text['status'],
                "message": text['message'],
                "data": text['data'],
                "gameData": text['gameData'],
                "caughtData": caught_data,
            }
            await self.send({
                "type": "websocket.send",
                "text": json.dumps(response),
            })

    async def call_uno(self, event):
        text = json.loads(event['text'])
        status = text['status']
        data = text['data']
        if status == "failed_call_uno":
            # If this was failed UNO call, only send to the player who called this.
            if data['username'] == self.me.username:
                await self.send({
                    "type": "websocket.send",
                    "text": event['text']
                })
                return
        else:
            # Else if it was a success, send to everyone.
            await self.send({
                "type": "websocket.send",
                "text": event['text']
            })

    async def user_new(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def won_game(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def won_round(self, event):
        text = event.get('text', None)
        if text:
            loaded_dict_data = json.loads(text)
            extra_data = {
                "serializedPlayer": json.dumps(self.player_server_obj, cls=CustomEncoder),
            }
            loaded_dict_data.update(extra_data)
            await self.send({
                "type": "websocket.send",
                "text": json.dumps(loaded_dict_data)
            })

    async def keep_card(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def voluntary_draw_card(self, event):
        text = json.loads(event['text'])
        voluntary_draw_data = text['voluntaryDrawData']
        username = voluntary_draw_data['username']
        if username != self.me.username:
            # Hiding drawn card if this is not the player who drew the card.
            voluntary_draw_data['drawnCard'] = None
        response = {
            "status": text['status'],
            "message": text['message'],
            "data": text['data'],
            "gameData": text['gameData'],
            "voluntaryDrawData": voluntary_draw_data,
        }
        await self.send({
            "type": "websocket.send",
            "text": json.dumps(response),
        })

    async def forced_draw_card(self, event):
        text = json.loads(event['text'])
        forced_draw_data = text['forcedDrawData']
        username = forced_draw_data['username']
        # print("Draw Card called.")
        # print(forced_draw_data)
        if username != self.me.username:
            # Hiding drawn card if this is not the player who drew the card.
            forced_draw_data['drawnCards'] = None

        response = {
            "status": text['status'],
            "message": text['message'],
            "data": text['data'],
            "gameData": text['gameData'],
            "forcedDrawData": forced_draw_data,
        }
        await self.send({
            "type": "websocket.send",
            "text": json.dumps(response)
            # "text": event['text']
        })

    async def play_card(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def enter_room(self, event):
        # This method actually sends the message
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def broadcast_notification(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def start_game(self, event):
        await self.increase_total_played_games_count(player_username=self.me.username)
        if self.game.game_type == GameServer.PUBLIC:
            print("FFFF: Starting Public Game inside Handler.")
        text = event.get('text', None)
        if text:
            loaded_dict_data = json.loads(text)
            extra_data = {
                "serializedPlayer": json.dumps(self.player_server_obj, cls=CustomEncoder),
            }
            loaded_dict_data.update(extra_data)
            await self.send({
                "type": "websocket.send",
                "text": json.dumps(loaded_dict_data)
            })

    async def end_game(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def websocket_disconnect(self, event):
        print("disconnected", event)
        # Leaving current Game
        if self.game is not None:
            me = self.me
            self.game.leave_game(self.player_server_obj)
            del self.player_server_obj
            response = {
                "status": "user_left_room",
                "message": "Disconnecting...",
                "data": {
                    "left_user_username": me.username,
                    "game_room_unique_id": self.game_room_id
                },
                "gameData": json.dumps(self.game.prepare_client_data(), cls=CustomEncoder)
            }
            await self.channel_layer.group_send(
                self.game_room_id,
                {
                    "type": "user_left_room",
                    "text": json.dumps(response)
                }
            )

            await self.channel_layer.group_discard(
                self.game_room_id,
                self.channel_name
            )

    async def user_left_room(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text'],
        })

    # @database_sync_to_async
    # def set_is_online_false(self):
    #     player_obj = self.player_obj
    #     player_obj.is_online = False
    #     player_obj.save()
    #
    # @database_sync_to_async
    # def set_is_online_true(self):
    #     player_obj = self.player_obj
    #     player_obj.is_online = True
    #     player_obj.save()

    # @database_sync_to_async
    # def get_game_room(self, unique_id):
    #     return GameRoom.objects.get(unique_game_id=unique_id)

    # @database_sync_to_async
    # def set_is_game_running_true(self):
    #     game_room_obj = self.game_room_obj
    #     game_room_obj.is_game_running = True
    #     game_room_obj.save()
    #
    # @database_sync_to_async
    # def set_is_game_running_false(self):
    #     game_room_obj = self.game_room_obj
    #     game_room_obj.is_game_running = False
    #     game_room_obj.save()

    # @database_sync_to_async
    # def get_player_obj(self):
    #     me = self.me
    #     game_room_obj = self.game_room_obj
    #     return Player.objects.get(player=me, game_room=game_room_obj)

    @database_sync_to_async
    def get_user_profile_obj(self):
        me = self.me
        return UserProfile.objects.get(user=me)

    @database_sync_to_async
    def increase_total_played_games_count(self, player_username):
        player = User.objects.get(username=player_username)

        player_profile = UserProfile.objects.get(user=player)

        player_profile.total_games_count += 1

        player_profile.save()

    @database_sync_to_async
    def handle_winning_game(self, winner_username):
        """
        Updates the value in the database when a user wins the game.
        :param winner_username: Username of player who won the game.
        :return:
        """
        # Fetching User object.
        winner = User.objects.get(username=winner_username)

        # Fetching UserProfile object.
        winner_profile = UserProfile.objects.get(user=winner)

        # Updating won games count
        winner_profile.won_games_count += 1

        # Updating won rounds count
        winner_profile.won_rounds_count += 1

        # Updating winning streak
        winner_profile.winning_streak += 1

        winner_profile.save()

    @database_sync_to_async
    def handle_losing_game(self, loser_username):
        """
        Updates the value in the database when a user loses the game.
        :param loser_username: Username of player who lost the game.
        :return:
        """

        loser = User.objects.get(username=loser_username)

        loser_profile = UserProfile.objects.get(user=loser)

        # Resetting Winning streak
        loser_profile.winning_streak = 0

        loser_profile.save()

    @database_sync_to_async
    def handle_winning_round(self, winner_username):
        """
        Updates the value in the database when a user wins the round.
        :param winner_username: Username of player who won the round.
        :return:
        """
        # Fetching User object.
        winner = User.objects.get(username=winner_username)

        # Fetching UserProfile object.
        winner_profile = UserProfile.objects.get(user=winner)

        # Updating won rounds count
        winner_profile.won_rounds_count += 1

        winner_profile.save()
