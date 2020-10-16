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
        """
            Example event:
            event = {
                'type': 'websocket.receive',
                'text': '{
                    "type":"enter.room",
                    "text":{
                        "status":"connected",
                        "message": "<some_message>",
                        "data": {
                            // Some data
                        }
                    }
                }'
            }
        """
        # print("received", event)
        front_text = event.get('text', None)
        skipped_data = None
        if front_text:
            loaded_dict_data = json.loads(front_text)
            type_of_event = loaded_dict_data['type']
            text_of_event = loaded_dict_data['text']
            DO_NOT_SEND = False
            if type_of_event == "user.new":
                DO_NOT_SEND = True
                # Now we need to broadcast an event that this user has joined the room
                print(text_of_event, "is sent by the Client")
                client_data_dict = text_of_event
                # e.g. client_data_dict = {"username": "admin", "game_room_unique_id": "123ABCabc"}
                print("PRINTED:- ", client_data_dict)
                await self.channel_layer.group_send(
                    self.game_room_id,
                    {
                        "type": "new_user_entered_room",
                        "text": json.dumps(client_data_dict), # event['text'] will now be a json string
                    }
                )
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
                if self.game.is_valid_move(client_data=client_data, server_data=server_data):
                    skipped_data = self.game.play_card(client_data=client_data)
                    print("Skipped Data", skipped_data)
                else:
                    # Handle Cheating
                    # print(f"This is NOT a valid move.")
                    pass

            if not DO_NOT_SEND:
                response = {
                    "status": text_of_event['status'],
                    "message": text_of_event['message'],
                    "data": text_of_event['data'],
                    "gameData": json.dumps(self.game.prepare_client_data(), cls=CustomEncoder),
                }

                # Broadcasts the enter_room event to be sent
                await self.channel_layer.group_send(
                    self.game_room_id,
                    {
                        "type": type_of_event,
                        "text": json.dumps(response)
                    }
                )

                if skipped_data:
                    print("Should call Draw Card.")
                    response_ = {
                        "status": "draw_card",
                        "message": "Card(s) have been drawn.",
                        "data": json.dumps(skipped_data, cls=CustomEncoder),
                    }

                    await self.channel_layer.group_send(
                        self.game_room_id,
                        {
                            "type": "draw.card",
                            "text": json.dumps(response_),
                        }
                    )
                print("\n\n\n\n")

    async def new_user_entered_room(self, event):
        print("new_user_entered_room function Called")
        # event is a dictionary having keys: type, text
        client_data_json = event.get('text') # client_data_json is a json string
        client_data = json.loads(client_data_json) # client_data is a dictionary
        username = client_data['username']
        game_room_unique_id = client_data['game_room_unique_id']
        response = {
            "username": username,
            "game_room_unique_id": game_room_unique_id
        }
        await self.send({
            "type": "websocket.send",
            "text": json.dumps(response),
        })
        print("new_user_entered_room function ended")

    async def draw_card(self, event):
        text = json.loads(event['text'])
        data = json.loads(text['data'])
        print("Draw Card called.")
        print(data)
        username = data['username']
        if username != self.me.username:
            data['drawnCards'] = []
        response = {
            "status": text['status'],
            "message": text['message'],
            "data": json.dumps(data),
        }
        await self.send({
            "type": "websocket.send",
            "text": json.dumps(response)
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
        # print("disconnected", event)
        await self.set_is_online_false()
        me = self.me

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


