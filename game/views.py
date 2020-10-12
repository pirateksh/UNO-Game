from django.shortcuts import render, reverse, HttpResponseRedirect, HttpResponse, Http404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from .models import GameRoom, Player, Card, GameRoomDeckCard, PlayerHandCard
from channels.layers import get_channel_layer
import json
from asgiref.sync import async_to_sync

ERROR = "error"
SUCCESS = "success"
MAX_JOINED_PLAYER_COUNT = 10
MINIMUM_ONLINE_PLAYER_REQUIRED = 2

channel_layer = get_channel_layer()


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
        error_message = f"Login / Signup to join a Game Room."
        raise Http404(error_message)

    if game_room_qs:

        game_room = game_room_qs[0]
        player_obj = Player.objects.filter(game_room=game_room, player=user)
        if player_obj:
            error_message = f"You are already in this Game Room (Unique ID: {unique_id})."
            raise Http404(error_message)

        # If there are already 10 i.e. maximum players who have joined this Game Room.
        if game_room.joined_player_count == MAX_JOINED_PLAYER_COUNT:
            error_message = f"This Game Room (Unique ID: {unique_id}) has reached it's maximum player limit. You won't be able to join this. "
            raise Http404(error_message)

        # Creating new Player Object if this user has not joined the room
        Player.objects.create(player=user, game_room=game_room)

        try:
            return HttpResponseRedirect(reverse('enter_game_room', kwargs={'unique_id': unique_id}))
        except Http404:
            return HttpResponseRedirect(reverse('user_profile', kwargs={'username': user.username}))
    else:
        error_message = f"Game with unique_id {unique_id} not found."
        raise Http404(error_message)


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
        error_message = f"Login / Signup to enter a Game Room."
        raise Http404(error_message)

    if game_room_qs:
        # If Game Room Exists
        game_room = game_room_qs[0]
        all_game_room_players_qs = Player.objects.filter(game_room=game_room)
        players_qs = Player.objects.filter(player=user, game_room=game_room)
        online_player_qs = Player.objects.filter(player=user, is_online=True)

        # If user has already entered into another Game Room
        if online_player_qs and online_player_qs[0].game_room != game_room:
            error_message = f"You are already present in other game rooms. Leave them to join this room."
            raise Http404(error_message)

        # If user has not joined the room but is trying to enter it.
        if not players_qs:
            error_message = "You are not a member of this Room. Join the room and then try to enter."
            raise Http404(error_message)

        # If Game has already started in the Game Room. In this case Player won't be allowed to join it.from
        if game_room.is_game_running:
            error_message = f"A Game has started/is running in this Game Room (Unique ID: {unique_id}). Wait for it to end or join another Game Room."
            raise Http404(error_message)

        """
            The functionality implemented by below commented code is currently being done in the consumers.py.
            
            # # Setting Player's is_online status to true
            # player = players_qs[0]
            # player.is_online = True
            # player.save()
        """

        context = {
            'game_room': game_room,
            'players': all_game_room_players_qs,
        }
        return render(request, 'game/enter_game_room.html', context)
    else:
        error_message = f"Game with unique_id {unique_id} not found."
        raise Http404(error_message)


@login_required
def start_game(request, unique_id):
    """
        View to Start a Game in a Game Room. This will be called by an AJAX call.
    :param request:
    :param unique_id: Unique Game ID
    :return:
    """
    user = request.user
    data = {}
    message = ""
    if request.method == "GET":
        game_room_qs = GameRoom.objects.filter(unique_game_id=unique_id)
        if game_room_qs:
            game_room = game_room_qs[0]
            online_player_count = Player.objects.filter(game_room=game_room, is_online=True).count()

            # If current user is not the admin of GameRoom
            if user.username != game_room.admin.username:
                status = ERROR
                message = f"You are not the admin of this Game Room (Unique ID: {unique_id})."

            # If the Game is already running in this GameRoom
            elif game_room.is_game_running:
                status = ERROR
                message = f"Game is already Running in this Game Room (Unique ID: {unique_id})"

            # If count of currently online players is less than minimum required players (i.e. 2)
            elif online_player_count < MINIMUM_ONLINE_PLAYER_REQUIRED:
                status = ERROR
                message = f"Sufficient Players have not entered the Game Room yet. Wait for more players to Enter the Room."

            # If everything is fine
            else:
                # Change is_game_running to True
                game_room.is_game_running = True
                game_room.save()

                # Preparing Card Deck
                blue_cards, green_cards = Card.objects.filter(category=Card.BLUE), Card.objects.filter(category=Card.GREEN)
                yellow_cards, red_cards = Card.objects.filter(category=Card.YELLOW), Card.objects.filter(category=Card.RED)
                other_cards = Card.objects.filter(Q(category=Card.WILD) | Q(category=Card.WILD_FOUR))
                group_name = game_room.unique_game_id

                for cards, color in zip([blue_cards, green_cards, yellow_cards, red_cards, other_cards], ["Blue", "Green", "Yellow", "Red", "Wild and Wild Four"]):
                    notification_message = f"Adding {color} Cards to Deck."
                    broadcast_notification(group_name=group_name, message=notification_message)
                    for card in cards:
                        GameRoomDeckCard.objects.create(game_room=game_room, card=card)

                status = SUCCESS
        else:
            status = ERROR
            message = f"Game Room with Unique ID {unique_id} not found."
    else:
        status = ERROR
        message = f"Invalid Request"

    response = {
        "status": status,
        "data": data,
        "message": message,
    }
    return JsonResponse(response)


@login_required
def end_game(request, unique_id):
    """
        View to End a Game Running in a Game Room. This will be called by an AJAX call.
    :param request:
    :param unique_id:
    :return:
    """
    user = request.user
    data = {}
    message = ""
    if request.method == "GET":
        game_room_qs = GameRoom.objects.filter(unique_game_id=unique_id)
        if game_room_qs:
            game_room = game_room_qs[0]
            if user.username != game_room.admin.username:
                status = ERROR
                message = f"You are not the admin of this Game Room (Unique ID: {unique_id})."
            elif not game_room.is_game_running:
                status = ERROR
                message = f"No game is Running in this Game Room (Unique ID: {unique_id})"
            else:
                # Change is_game_running to False
                game_room.is_game_running = False
                game_room.save()

                # Clearing Game Room Deck Cards
                GameRoomDeckCard.objects.filter(game_room=game_room).delete()

                # Clearing Player Hand Cards for each player in this room
                players_qs = Player.objects.filter(game_room=game_room)
                for player in players_qs:
                    PlayerHandCard.objects.filter(player=player).delete()

                status = SUCCESS

        else:
            status = ERROR
            message = f"Game Room with Unique ID {unique_id} not found."
    else:
        status = ERROR
        message = f"Invalid Request"

    response = {
        "status": status,
        "data": data,
        "message": message,
    }
    return JsonResponse(response)


@login_required
def add_cards(request):
    """
        A View to add all cards possible in UNO in the Card Model.
        Ideally, to be called only once by Admin (superuser).
    :param request:
    :return:
    """
    user = request.user
    if user.is_superuser:
        all_cards = Card.objects.all()
        if all_cards:
            return HttpResponse("Cards are already set. If you want to set again, disable this from add_cards view.")
        for category in [Card.BLUE, Card.GREEN, Card.YELLOW, Card.RED]:
            Card.objects.create(category=category, number=Card.ZERO)

            for number in [Card.ONE, Card.TWO, Card.THREE, Card.FOUR, Card.FIVE, Card.SIX, Card.SEVEN, Card.EIGHT, Card.NINE, Card.SKIP, Card.REVERSE, Card.DRAW_TWO]:
                Card.objects.create(category=category, number=number)
                Card.objects.create(category=category, number=number)

        for i in range(4):
            Card.objects.create(category=Card.WILD, number=Card.NONE)
            Card.objects.create(category=Card.WILD_FOUR, number=Card.NONE)
        return HttpResponse("Cards have been set successfully.")
    else:
        raise Http404(f"You are not authenticated to visit this URL.")
