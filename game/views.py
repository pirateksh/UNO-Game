from django.shortcuts import render, reverse, HttpResponseRedirect, HttpResponse
from django.contrib.auth.decorators import login_required
from .models import GameRoom


@login_required
def create_game_room(request):
    user = request.user
    if user.is_authenticated:
        new_game_room = GameRoom.objects.create(admin=user)
        return HttpResponseRedirect(reverse('user_profile', kwargs={'username': user.username}))
    else:
        return HttpResponse(f"Oops! User with username {user.username} not found!")