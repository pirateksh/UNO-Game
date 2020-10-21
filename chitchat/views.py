from django.shortcuts import render, redirect
from django.http import Http404, HttpResponse

# Model related imports
from django.db.models import Q
from django.contrib.auth.models import User
from .models import ChatMessage, Thread, Friend


# View Classes
from django.views.generic import ListView
from django.views import View

from django.core import serializers
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin

from django.http import JsonResponse

@login_required
def main(request):
    if request.method == "GET":
        if request.GET.get('search_query', None):
            search_query = request.GET.get('search_query')
            data = {
                'result': []
            }
            query_result_for_username = User.objects.all().filter(username__istartswith=search_query)
            search_result = []
            for user in query_result_for_username:
                if user.username != request.user.username:
                    search_result.append(user.username)
            final_result = []
            if len(search_result):
                person1 = request.user.username
                for person2 in search_result:
                    friend_row_instance, order = Friend.objects.get_friend_status(person1, person2)
                    if friend_row_instance is None:
                        final_result.append([person2, 0]) # 0 means, show Add Friend beside person2 in the list
                    elif friend_row_instance.friend_status == 0:
                        if order == 1:
                            final_result.append([person2, 1])  # 1 means, show Pending Req. beside person2 in the list
                        else:
                            final_result.append([person2, 2])  # 2 means, show Accept Request beside person2 in the list
                    elif friend_row_instance.friend_status == 1:
                        final_result.append([person2, 3])  # 3 means, show already Friends beside person2 in the list
                data = {
                    'result': final_result
                }
            else:
                print("Result is Void")
            return JsonResponse(data)
        elif request.GET.get('other_person', None):
            other_person = request.GET.get('other_person')  # other_person is the friend request sender/receiver for request.user
            if other_person == request.user:
                return Http404
            row_instance = Friend.objects.add_friend_request(sender=request.user, receiver=other_person)
            new_status = row_instance.friend_status
            # print("new_status", new_status)
            data = {
                'result': new_status
            }
            return JsonResponse(data)
        else:
            # Fetching the Friends list
            friends = []
            friends_query_set = Friend.objects.all().filter((Q(sender=request.user) | Q(receiver=request.user)) & Q(friend_status=True))
            for friend in friends_query_set:
                if friend.sender.username == request.user.username:
                    friends.append(friend.receiver.username)
                else:
                    friends.append(friend.sender.username)
            context = {
                'friends': friends,
            }
            # return render(request, 'chitchat/main.html', context)
            return render(request, 'chitchat/index.html', context)


class Chat(LoginRequiredMixin, View):
    def get(self, request, username):
        person1 = request.user.username
        person2 = username  # from url
        if person1 == person2:
            raise Http404
        else:
            thread_instance = Thread.objects.get_thread_for_dual(person1, person2)
            if thread_instance is None:
                thread_instance = Thread.objects.create_thread(person1, person2)
                chats = None  # As just now the thread is created
                context = {
                    'chats': chats,
                }
                # raise Http404
                # return render(request, 'chitchat/chat.html', context)
                return JsonResponse(context)
            else:
                # print("Fetching Chats of", person1, "with ", person2)
                thread_id = thread_instance.id
                chats = ChatMessage.objects.all().filter(thread=thread_id).order_by('timestamp')
                first_name = User.objects.all().get(username=person2).first_name
                messages = []
                for chat in chats:
                    messages.append([chat.sender.username, chat.message, chat.timestamp])
                context = {
                    # 'chats': serializers.serialize('json', chats),
                    'chats': messages,
                    'other_user_first_name': first_name
                }
                # return render(request, 'chitchat/chat.html', context)
                return JsonResponse(context)

    def post(self, request, username):
        pass
