import asyncio
import json
from django.contrib.auth import get_user_model

# from the channels module
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async

# from the models
from .models import Thread, ChatMessage


def get_time_format(time):
    print(time) # e.g. 2020-10-21 12:11:54.252804+00:00
    return time

class ChatConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        print("Accepting an handshake request", event)
        # accepting the Handshake or Upgrade from HTTP to WebSocket
        await self.send({
            "type": "websocket.accept",
        })

        # grabbing other user from the URL
        person1 = self.scope['user'] # Currently logged in user
        person2 = self.scope['url_route']['kwargs']['username']
        # print(self.scope)

        thread_instance = await self.get_thread_for_dual(person1, person2)
        self.thread = thread_instance
        thread_id = None
        if thread_instance is None:
            # This means that there are no Talks between the two Yet
            # Need to Create new Thread for the dual and then asssign thread_id
            pass
        else:
            thread_id = thread_instance.id
            chats = ChatMessage.objects.all().filter(thread=thread_id).order_by('timestamp')
            context = {
                'chats': chats,
                'sender': person2  # i.e. the sender
            }
        chat_room = f"chat_{thread_id}" # This is Just a name given to our chat room
        self.chat_room = chat_room
        # print(chat_room)
        # print(self.channel_name)

        # Creating the Chat room
        await self.channel_layer.group_add(
            self.chat_room, # Name of the Chat-Room
            self.channel_name # Name of the Channel
        )

        # await asyncio.sleep(5)
        # await self.send({
        #     "type": "websocket.close",
        # })

    async def websocket_receive(self, event):
        # When a message is received from the Websocket
        data_received_dict = json.loads(event.get('text', None))
        message = data_received_dict['message']

        print("Consumer receiver Just Called and receiver: ", message)

        user = self.scope['user']
        sender = None # An User instance
        if user.is_authenticated:
            sender = user
        else:
            pass

        added_thread_instance = await self.chat_message_add(sender, message)

        # the response we need to send to the group through the channel layers
        # timestamp = get_time_format(added_thread_instance.timestamp)
        timestamp = str(added_thread_instance.timestamp)
        response_data = {
            "message": message,
            "sender": sender.username,
            "timestamp": timestamp
        }

        await self.channel_layer.group_send(
            self.chat_room, # name of the Chat root
            {
                'type': "chat_message",
                'text': json.dumps(response_data)
            }
        )

    # my custom event
    async def chat_message(self, event):
        await self.send({
            'type': "websocket.send",
            'text': event.get('text')
        })

    async def websocket_disconnect(self, event):
        print("Websocket Connection has been Disconnected", event)

    @database_sync_to_async
    def get_thread_for_dual(self, person1, person2):
        thread_instance = Thread.objects.get_thread_for_dual(person1, person2)
        return thread_instance

    @database_sync_to_async
    def chat_message_add(self, sender, message):
        return ChatMessage.objects.create(thread=self.thread, sender=sender, message=message)