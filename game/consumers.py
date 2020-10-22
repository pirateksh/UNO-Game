import asyncio
import json
from django.contrib.auth import get_user_model
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer

from .models import GameRoom, Player
from .helper import Card, PlayerServer, GameServer, Deck, CustomEncoder

User = get_user_model()


class GameRoomConsumer(AsyncConsumer):
    """
        A Consumer which will consume (handle) events related to Game Room
    """

    async def websocket_connect(self, event):
        # print("connected", event)
        unique_id = self.scope['url_route']['kwargs']['unique_id']
        self.me = self.scope['user']
        game_room_obj = await self.get_game_room(unique_id=unique_id)

        self.game_room_obj = game_room_obj

        player_obj = await self.get_player_obj()
        self.player_obj = player_obj

        # Uncomment if using reconnecting socket
        await self.set_is_online_true()

        game_room_id = f"game_room_{unique_id}"
        self.game_room_id = game_room_id

        self.player_server_obj = PlayerServer(username=self.me.username)
        self.game = GameServer.create_new_game(unique_id, self.player_server_obj)
        # print(self.game)
        # print(self.game.players)

        await self.channel_layer.group_add(
            game_room_id,
            self.channel_name
        )
        await self.send({
            "type": "websocket.accept"
        })

    async def websocket_receive(self, event):
        # print("received", event)
        front_text = event.get('text', None)
        forced_draw_data = None  # If some player had to draw cards due to DRAW_TWO or WILD_FOUR.
        voluntary_draw_data = None  # When player voluntary drew a card.
        won_data = None  # When player has played all his cards.
        caught_data = None  # When a player didn't call uno and got caught. Stores cards drawn by that player.
        if front_text:
            loaded_dict_data = json.loads(front_text)
            type_of_event = loaded_dict_data['type']
            text_of_event = loaded_dict_data['text']

            if type_of_event == "user.new":
                # Now we need to broadcast an event that this user has joined the room
                print(text_of_event, "is sent by the Client")
                client_data_dict = text_of_event
                # e.g. client_data_dict = {"new_user_username": "alice", "unique_peer_id": "xyz123XYZ", "game_room_unique_id": "123ABCabc"}
                print("PRINTED:- ", client_data_dict)
                await self.channel_layer.group_send(
                    self.game_room_id,
                    {
                        "type": "new_user_entered_room",
                        "text": json.dumps(client_data_dict), # event['text'] will now be a json string
                    }
                )
                return
            elif type_of_event == "start.game":
                # print(f"Before Broadcasting: Going to call start.game")
                self.game.start_game()
                # print(f"Deck and Hands are Ready")
                await self.set_is_game_running_true()
            elif type_of_event == "end.game":
                self.game.end_game()
                await self.set_is_game_running_false()
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
                            won_username = won_data['username']
                            won_score = int(won_data['score'])
                            if won_score >= GameServer.WINNING_SCORE:
                                text_of_event['status'] = "won_game"
                                type_of_event = "won_game"
                                await self.set_is_game_running_false()
                                print(f"End Game. {won_username} has scored winning points.")
                            else:
                                text_of_event['status'] = "won_round"
                                type_of_event = "won_round"
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
                    self.game.call_uno()
                else:
                    print(f"Cannot call UNO!")
                    return
            elif type_of_event == "catch.player":  # When someone catches a player who forgot to say UNO!
                client_data = text_of_event['data']
                server_data = {
                    "caught": self.game.get_current_player().username,
                    "catcher": self.me.username,
                }
                if self.game.is_valid_catch(client_data=client_data, server_data=server_data):
                    caught_data = self.game.catch_player()
                else:
                    print("Cannot catch.")
                    return

            response = {
                "status": text_of_event['status'],
                "message": text_of_event['message'],
                "data": text_of_event['data'],
                "gameData": json.dumps(self.game.prepare_client_data(), cls=CustomEncoder),
            }

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

            # if type_of_event in ["start.game", "play.card", "forced_draw_card", "keep.card", "voluntary_draw_card"]:
            #     print("Sleeping for 2 seconds.")
            #     await asyncio.sleep(2)
            #     print("Woke up after 2 seconds.")
            #     response = {
            #         "status": "update_current_player",
            #         "message": "Updating current player",
            #         "data": {
            #             "currentPlayerIndex": self.game.current_player_index,
            #         },
            #     }
            #     await self.channel_layer.group_send(
            #         self.game_room_id,
            #         {
            #             "type": "update_current_player",
            #             "text": json.dumps(response)
            #         }
            #     )

            # print("\n\n\n\n")

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
        caught_data = text['caughtData']
        data = text['data']
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
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def new_user_entered_room(self, event):
        print("new_user_entered_room function Called")
        # event is a dictionary having keys: type, text
        client_data_json = event.get('text') # client_data_json is a json string
        client_data = json.loads(client_data_json) # client_data is a dictionary
        new_user_username = client_data['new_user_username']
        unique_peer_id = client_data['unique_peer_id']
        game_room_unique_id = client_data['game_room_unique_id']
        response = {
            "new_user_username": new_user_username,
            "unique_peer_id": unique_peer_id,
            "game_room_unique_id": game_room_unique_id
        }
        print("Broadcasting,", response, "to all members of the group...")
        await self.send({
            "type": "websocket.send",
            "text": json.dumps(response),
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
        me = self.me
        await self.channel_layer.group_send(
            self.game_room_id,
            {
                "type": "user_left_room",
                "text": json.dumps({"left_user_username": self.me.username, "game_room_unique_id": self.game_room_id})
            }
        )

        await self.set_is_online_false()


        # Leaving current Game
        if len(self.game.players) == 1:
            await self.set_is_game_running_false()
        self.game.leave_game(self.player_server_obj)
        del self.player_server_obj

        response = {
            "status": "disconnected",
            "message": "Disconnecting...",
            "data": {
                "username": me.username,
                "pk": me.pk,
            },
        }
        await self.channel_layer.group_send(
            self.game_room_id,
            {
                "type": "leave.room",
                "text": json.dumps(response)
            }
        )
        await self.channel_layer.group_discard(
            self.game_room_id,
            self.channel_name
        )

    async def user_left_room(self, event):
        client_data_json = event.get('text')
        client_data = json.loads(client_data_json)
        left_user_username = client_data['left_user_username']
        game_room_unique_id = client_data['game_room_unique_id']
        response = {
            "left_user_username": left_user_username,
            "game_room_unique_id": game_room_unique_id
        }
        await self.send({
            "type": "websocket.send",
            "text": json.dumps(response),
        })

    async def leave_room(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    @database_sync_to_async
    def set_is_online_false(self):
        player_obj = self.player_obj
        player_obj.is_online = False
        player_obj.save()

    @database_sync_to_async
    def set_is_online_true(self):
        player_obj = self.player_obj
        player_obj.is_online = True
        player_obj.save()

    @database_sync_to_async
    def get_game_room(self, unique_id):
        return GameRoom.objects.get(unique_game_id=unique_id)

    @database_sync_to_async
    def set_is_game_running_true(self):
        game_room_obj = self.game_room_obj
        game_room_obj.is_game_running = True
        game_room_obj.save()

    @database_sync_to_async
    def set_is_game_running_false(self):
        game_room_obj = self.game_room_obj
        game_room_obj.is_game_running = False
        game_room_obj.save()

    @database_sync_to_async
    def get_player_obj(self):
        me = self.me
        game_room_obj = self.game_room_obj
        return Player.objects.get(player=me, game_room=game_room_obj)


class LobbyConsumer(AsyncConsumer):

    async def websocket_connect(self, event):
        print("connect", event)
        await self.send({
            "type": "websocket.accept",
        })

    async def websocket_receive(self, event):
        print("receive", event)
        await asyncio.sleep(2)
        await self.send({
            "type": "websocket.send",
            "text": event['text'],
        })

    async def websocket_disconnect(self, event):
        print("disconnected", event)