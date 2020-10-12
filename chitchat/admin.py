from django.contrib import admin
from .models import Thread, ChatMessage


class ThreadAdmin(admin.ModelAdmin):
    model = Thread
    list_display = ['id','person1','person2','updated','timestamp']


class ChatMessageAdmin(admin.ModelAdmin):
    model = ChatMessage
    list_display = ['id', 'thread', 'sender', 'message', 'timestamp']


admin.site.register(Thread, ThreadAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)