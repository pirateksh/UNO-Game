from django.shortcuts import render, reverse, HttpResponseRedirect, HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.contrib import messages
from django.conf import settings
from .models import GameRoom, Player, id_generator
from .helper import GameServer
from user_profile.models import UserProfile

from channels.layers import get_channel_layer
import json
from asgiref.sync import async_to_sync

ERROR = "error"
SUCCESS = "success"
MAX_JOINED_PLAYER_COUNT = 10
MINIMUM_ONLINE_PLAYER_REQUIRED = 3

channel_layer = get_channel_layer()

User = get_user_model()


def broadcast_notification(group_name, message):
    """
        Helper Function to Broadcast Notifications in Game Room.
    :param group_name: Name of Group in which event should be broadcast.
    :param message: Notification Message.
    :return:
    """
    text = {
        "status": "broadcast_notification",
        "message": message,
    }
    group_name = f"game_room_{group_name}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "broadcast.notification",
            "text": json.dumps(text)
        }
    )


@login_required
def play_now(request):
    player = request.user
    if not player.is_authenticated:
        message = f"You need to login first!"
        return render(request, '404.html', {"message": message})

    player_profile = UserProfile.objects.get(user=player)
    if not player_profile.is_email_verified:
        messages.info(request, f"Your email is not verified.")
        return HttpResponseRedirect(reverse('user_profile', kwargs={"username": player.username}))

    # Show animation in case player's league upgraded/degraded.
    if player_profile.is_league_changed != UserProfile.LEAGUE_STABLE:
        league_change_context = {
            "player": player,
            "profile": player_profile,
            "is_league_changed": player_profile.is_league_changed,
        }
        player_profile.is_league_changed = UserProfile.LEAGUE_STABLE
        player_profile.save()
        return render(request, 'game/league_changed.html', league_change_context)

    # Fetching top 10 player's
    top_ratings = UserProfile.objects.order_by('-current_rating').filter(total_public_games_count__gt=0).values_list('current_rating', flat=True).distinct()
    top_players = UserProfile.objects.order_by('-current_rating').filter(total_public_games_count__gt=0).filter(current_rating__in=top_ratings[:10])
    context = {
        "top_players": top_players,
    }
    return render(request, 'game/play_now.html', context=context)


# TODO: Play Anonymously option for authenticated users as well.
def enter_public_play(request):
    """
    View to enter Public Game Room
    :param request:
    :return:
    """
    player = request.user
    if player.is_authenticated:
        player_profile = UserProfile.objects.get(user=player)
        if not player_profile.is_email_verified:
            messages.info(request, f"Your email is not verified.")
            return HttpResponseRedirect(reverse('user_profile', kwargs={"username": player.username}))
        current_player_league = player_profile.current_league
        if GameServer.AVAILABLE_PUBLIC_GAMES:
            for public_game in GameServer.AVAILABLE_PUBLIC_GAMES:
                if public_game.get_count_of_players() < MAX_JOINED_PLAYER_COUNT:
                    if not public_game.is_game_running:
                        if public_game.league == current_player_league:
                            active_unique_id = public_game.unique_id
                            return HttpResponseRedirect(
                                reverse('proceed_to_game',
                                        kwargs={'game_type': GameServer.PUBLIC, 'unique_id': active_unique_id}))
        # If no Public Game Room Available, create new.
        active_unique_id = id_generator(10)
        return HttpResponseRedirect(
            reverse('proceed_to_game', kwargs={'game_type': GameServer.PUBLIC, 'unique_id': active_unique_id}))
    else:
        message = f"You need to Login/Signup first."
        return render(request, '404.html', {"message": message})


def enter_friend_play(request):
    """
    View to enter Friendly Game Room.
    :param request:
    :return:
    """
    player = request.user
    player_profile = UserProfile.objects.get(user=player)
    if not player_profile.is_email_verified:
        messages.info(request, f"Your email is not verified.")
        return HttpResponseRedirect(reverse('user_profile', kwargs={"username": player.username}))

    if request.method == "POST":  # Enter Existing Game
        unique_id = request.POST['friend_unique_id']
        if GameServer.AVAILABLE_FRIEND_GAMES:
            for friend_game in GameServer.AVAILABLE_FRIEND_GAMES:
                if friend_game.unique_id == unique_id:
                    if friend_game.get_count_of_players() == MAX_JOINED_PLAYER_COUNT:
                        message = f"Custom Game Room with ID {unique_id} is full."
                        return render(request, '404.html', {"message": message})
                    if friend_game.is_game_running:
                        message = f"Game is already running in Custom Game Room with ID {unique_id}."
                        return render(request, '404.html', {"message": message})
                    return HttpResponseRedirect(
                        reverse('proceed_to_game',
                                kwargs={"game_type": GameServer.CUSTOM, "unique_id": unique_id}))
        message = f"Custom Game Room with ID {unique_id} does'nt exist."
        return render(request, '404.html', {"message": message})
    elif request.method == "GET":  # Creating New Game and Entering
        unique_id = id_generator(10)
        return HttpResponseRedirect(
            reverse('proceed_to_game', kwargs={"game_type": GameServer.CUSTOM, "unique_id": unique_id}))


def proceed_to_game(request, game_type, unique_id):
    """
    View to show game room tutorial.
    :param request:
    :param game_type:
    :param unique_id:
    :return:
    """
    context = {
        "game_type": game_type,
        "unique_id": unique_id,
    }
    return render(request, 'game/info.html', context)


@login_required
def enter_game_room(request, game_type, unique_id):
    """
        View to Enter the Game Room. This can be called only after
        a player has Joined the Game Room.
    :param request:
    :param game_type: Type of Game: PUBLIC or CUSTOM.
    :param unique_id:
    :return:
    """

    player = request.user
    player_profile = UserProfile.objects.get(user=player)
    if not player_profile.is_email_verified:
        messages.info(request, f"Your email is not verified.")
        return HttpResponseRedirect(reverse('user_profile', kwargs={"username": player.username}))

    if not player.is_authenticated:
        error_message = f"Login / Signup to enter a Game Room."
        return render(request, '404.html', {"message": error_message})

    context = {
        'unique_id': unique_id,
        'peer_js_host_name': settings.PEER_JS_HOST_NAME,
        'peer_js_port_number': settings.PEER_JS_PORT_NUMBER,
    }
    return render(request, 'game/enter_game_room.html', context)
