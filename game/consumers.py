import asyncio
import json
from django.contrib.auth import get_user_model
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer
from .models import GameRoom, Player

User = get_user_model()


class GameRoomConsumer(AsyncConsumer):
    """
        A Consumer which will consume (handle) events related to Game Room
    """

    async def websocket_connect(self, event):
        print("connected", event)
        unique_id = self.scope['url_route']['kwargs']['unique_id']

        game_room_obj = await self.get_game_room(unique_id=unique_id)
        print(game_room_obj.unique_game_id)
        self.game_room_obj = game_room_obj

        player_obj = await self.get_player_obj()
        self.player_obj = player_obj

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
        print("received", event)
        front_text = event.get('text', None)
        if front_text:
            loaded_dict_data = json.loads(front_text)
            # Broadcasts the enter_room event to be sent
            await self.channel_layer.group_send(
                self.game_room_id,
                {
                    # "type": "enter_room",
                    # Above commented line is also correct
                    "type": "enter.room",
                    "text": json.dumps(loaded_dict_data)
                }
            )
        # {'type': 'websocket.receive', 'text': '{"status":"connected","username":"ankitsang","pk":"3"}'}

    async def enter_room(self, event):
        # This method actually sends the message
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def websocket_disconnect(self, event):
        print("disconnected", event)
        await self.set_is_online_false()

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

# class ChatConsumer(AsyncConsumer):
#
#     async def websocket_connect(self, event):
#         print("connected", event)
#         other_user = self.scope['url_route']['kwargs']['username']
#         me = self.scope['user']
#         # print(other_user, me)
#         thread_obj = await self.get_thread(me, other_user)
#
#         # Added to class as we will use it in create_chat_message() method
#         self.thread_obj = thread_obj
#
#         print(me, thread_obj.id)
#         chat_room = f"thread_{thread_obj.id}"
#
#         # Added as a instance variable to be used in websocket_receive() method
#         self.chat_room = chat_room
#
#         # Add this channel to Unique Chat Room
#         await self.channel_layer.group_add(
#             chat_room,
#             self.channel_name,  # This is a default attribute of channels
#         )
#
#         # Accept the connection
#         await self.send({
#             "type": "websocket.accept"
#         })
#
#     async def websocket_receive(self, event):
#         # When a message is received from the websocket
#         print("received", event)
#         front_text = event.get('text', None)
#         if front_text is not None:
#             loaded_dict_data = json.loads(front_text)
#             msg = loaded_dict_data.get('message')
#             user = self.scope['user']
#             username = 'default'
#             if user.is_authenticated:
#                 username = user.username
#             my_response = {
#                 "message": msg,
#                 "username": username
#             }
#
#             # Creating Database entry for this message
#             await self.create_chat_message(msg=msg)
#
#             # Broadcasts the message event to be sent
#             await self.channel_layer.group_send(
#                 self.chat_room,
#                 {
#                     # "type": "chat_message",
#                     # Above commented line is also correct
#                     "type": "chat.message",
#                     "text": json.dumps(my_response)
#                 }
#             )
#
#     async def chat_message(self, event):
#         # This method actually sends the message
#         await self.send({
#             "type": "websocket.send",
#             "text": event['text']
#         })
#
#     async def websocket_disconnect(self, event):
#         # When the websocket disconnects
#         print("disconnected", event)
#         raise StopConsumer
#
#     @database_sync_to_async
#     def get_thread(self, user, other_username):
#         return Thread.objects.get_or_new(user, other_username)[0]
#
#     @database_sync_to_async
#     def create_chat_message(self, msg):
#         thread_obj = self.thread_obj
#         me = self.scope['user']
#         return ChatMessage.objects.create(thread=thread_obj, user=me, message=msg)
