from django.shortcuts import render, get_object_or_404, HttpResponse
from django.contrib.auth import get_user_model

from game.models import GameRoom

User = get_user_model()


def user_profile_view(request, username):
    user = get_object_or_404(User, username=username)
    if user.is_authenticated:
        user_game_room_qs = GameRoom.objects.filter(admin=user)
        print(user_game_room_qs[0].unique_game_id)
        other_game_room_qs = GameRoom.objects.exclude(admin=user)
        context = {
            'user_game_rooms': user_game_room_qs,
            'other_game_rooms': other_game_room_qs,
        }
        return render(request, 'user_profile/profile.html', context=context)
    else:
        return HttpResponse(f"Oops! User with username {username} not found!")
