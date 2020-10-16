from django.shortcuts import render, get_object_or_404, HttpResponse
from django.contrib.auth import get_user_model

from game.models import GameRoom, Player

User = get_user_model()

def user_profile_view(request, username):
    if request.user.username != username:
        return HttpResponse(f"Other Profile Access try for user: {username}, by user: {request.user.username}")
    user = get_object_or_404(User, username=username)
    if user.is_authenticated:
        user_game_room_qs = GameRoom.objects.filter(admin=user)
        other_game_room_qs = GameRoom.objects.exclude(admin=user)
        player_qs = Player.objects.filter(player=user)
        joined_game_rooms = []
        for player in player_qs:
            joined_game_rooms.append(player.game_room)
        context = {
            'user_game_rooms': user_game_room_qs,
            'other_game_rooms': other_game_room_qs,
            'joined_game_rooms': joined_game_rooms,
        }
        return render(request, 'user_profile/profile.html', context=context)
    else:
        return HttpResponse(f"Oops! User with username {username} not found!")
