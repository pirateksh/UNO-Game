from django.contrib import admin
from .models import Thread, ChatMessage, Friend


class ThreadAdmin(admin.ModelAdmin):
    model = Thread
    list_display = ['id','person1','person2','updated','timestamp']


class ChatMessageAdmin(admin.ModelAdmin):
    model = ChatMessage
    list_display = ['id', 'thread', 'sender', 'message', 'timestamp']


class FriendAdmin(admin.ModelAdmin):
    model = Friend
    list_display = ['id', 'sender', 'receiver', 'friend_status']


admin.site.register(Thread, ThreadAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)
admin.site.register(Friend, FriendAdmin)