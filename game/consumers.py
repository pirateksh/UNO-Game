import asyncio
import json
from django.contrib.auth import get_user_model
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer
from .models import GameRoom, Player, Card, GameRoomDeckCard

User = get_user_model()


class GameRoomConsumer(AsyncConsumer):
    """
        A Consumer which will consume (handle) events related to Game Room
    """

    async def websocket_connect(self, event):
        print("connected", event)
        unique_id = self.scope['url_route']['kwargs']['unique_id']

        game_room_obj = await self.get_game_room(unique_id=unique_id)

        self.game_room_obj = game_room_obj

        player_obj = await self.get_player_obj()
        self.player_obj = player_obj

        # Uncomment if using reconnecting socket
        await self.set_is_online_true()

        game_room_id = f"game_room_{unique_id}"
        self.game_room_id = game_room_id

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
            event = {'type': 'websocket.receive', 'text': '{"type":"enter.room","text":{"status":"connected","username":"pirateksh","pk":"1"}}'}
        """
        print("received", event)
        front_text = event.get('text', None)
        if front_text:
            loaded_dict_data = json.loads(front_text)
            type_of_event = loaded_dict_data['type']
            text_of_event = loaded_dict_data['text']

            # Broadcasts the enter_room event to be sent
            await self.channel_layer.group_send(
                self.game_room_id,
                {
                    "type": type_of_event,
                    "text": json.dumps(text_of_event)
                }
            )

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

    # async def start_game(self, event):
    #     await self.send({
    #         "type": "websocket.send",
    #         "text": event['text']
    #     })
    #
    # async def end_game(self, event):
    #     await self.send({
    #         "type": "websocket.send",
    #         "text": event['text']
    #     })

    async def websocket_disconnect(self, event):
        print("disconnected", event)
        await self.set_is_online_false()
        me = self.scope['user']
        response = {
            "status": "disconnected",
            "username": me.username,
            "pk": me.pk,
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
    def get_player_obj(self):
        me = self.scope['user']
        game_room_obj = self.game_room_obj
        return Player.objects.get(player=me, game_room=game_room_obj)
