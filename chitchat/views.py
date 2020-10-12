from django.shortcuts import render, redirect
from django.http import Http404, HttpResponseForbidden

# Model related imports
from django.contrib.auth.models import User
from .models import ChatMessage, Thread

# View Classes
from django.views.generic import ListView
from django.views import View

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin


@login_required
def main(request):
    print("main called")
    context = {
        'friends': User.objects.all(),
    }
    return render(request, 'chitchat/main.html', context)


class Chat(LoginRequiredMixin, View):
    def get(self, request, username):
        person1 = request.user.username
        person2 = username # from url
        if person1 == person2:
            raise Http404
        else:
            thread_instance = Thread.objects.get_thread_for_dual(person1, person2)
            if thread_instance is None:
                thread_instance = Thread.objects.create_thread(person1, person2)
                chats = None # As just now the thread is created
                context = {
                    'chats': chats,
                    'person2': username
                }
                # raise Http404
                return render(request, 'chitchat/chat.html', context)
            else:
                thread_id = thread_instance.id
                chats = ChatMessage.objects.all().filter(thread=thread_id).order_by('timestamp')
                context = {
                    'chats': chats,
                    'person2': username
                }
                return render(request, 'chitchat/chat.html', context)

    def post(self, request, username):
        pass
