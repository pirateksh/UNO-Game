from django.shortcuts import render, reverse, HttpResponseRedirect, HttpResponse
from django.contrib.auth.decorators import login_required
from .models import GameRoom, Player


@login_required
def create_game_room(request):
    """
        View to Create Game Room
    :param request:
    :return:
    """
    user = request.user
    if user.is_authenticated:
        # Creating a new GameRoom Object
        new_game_room = GameRoom.objects.create(admin=user)

        # Creating a Player Object corresponding to admin
        player_obj = Player.objects.create(player=user, game_room=new_game_room)

        return HttpResponseRedirect(reverse('user_profile', kwargs={'username': user.username}))
    else:
        return HttpResponse(f"Oops! User with username {user.username} not found!")


@login_required
def join_game_room(request, unique_id):
    """
        View to Join Existing Game Room, if not already joined.
    :param request:
    :param unique_id: Unique Game ID of the Game Room
    :return:
    """
    game_room_qs = GameRoom.objects.filter(unique_game_id=unique_id)
    user = request.user
    if not user.is_authenticated:
        return HttpResponse(f"Login / Signup to join a Game Room.")
    if game_room_qs:
        game_room = game_room_qs[0]
        player = Player.objects.filter(game_room=game_room, player=user)
        if player:
            return HttpResponse(f"You are already in this Game Room (Unique ID: {unique_id}).")
        player = Player.objects.create(player=user, game_room=game_room)
        return HttpResponseRedirect(reverse('enter_game_room', kwargs={'unique_id': unique_id}))
    else:
        return HttpResponse(f"Game with unique_id {unique_id} not found.")


@login_required
def enter_game_room(request, unique_id):
    """
        View to Enter the Game Room. This can be called only after
        a player has Joined the Game Room.
    :param request:
    :param unique_id:
    :return:
    """
    game_room_qs = GameRoom.objects.filter(unique_game_id=unique_id)
    user = request.user
    if not user.is_authenticated:
        return HttpResponse(f"Login / Signup to enter a Game Room.")
    if game_room_qs:
        game_room = game_room_qs[0]
        players_qs = Player.objects.filter(game_room=game_room)

        is_member = False
        for player in players_qs:
            # If user has joined the Game room
            if user.username == player.player.username:
                is_member = True
                break

        # If user is admin of the game room
        if game_room.admin.username == user.username:
            is_member = True

        # If user has neither joined the room nor is the admin but is trying to enter it.
        if not is_member:
            return HttpResponse("You are not a member of this Room. Join the room and then try to enter.")

        context = {
            'game_room': game_room,
            'players': players_qs,
        }
        return render(request, 'game/enter_game_room.html', context)
    else:
        return HttpResponse(f"Game with unique_id {unique_id} not found.")