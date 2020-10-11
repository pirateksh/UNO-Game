from django.shortcuts import render, reverse, HttpResponseRedirect, HttpResponse, Http404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import GameRoom, Player, Card, GameRoomDeckCard, PlayerHandCard

ERROR = "error"
SUCCESS = "success"


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
        player_obj = Player.objects.filter(game_room=game_room, player=user)
        if player_obj:
            return HttpResponse(f"You are already in this Game Room (Unique ID: {unique_id}).")

        # Creating new Player Object if this user has not joined the room
        player_obj = Player.objects.create(player=user, game_room=game_room)

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

        # If user has not joined the room but is trying to enter it.
        if not is_member:
            return HttpResponse("You are not a member of this Room. Join the room and then try to enter.")

        context = {
            'game_room': game_room,
            'players': players_qs,
        }
        return render(request, 'game/enter_game_room.html', context)
    else:
        return HttpResponse(f"Game with unique_id {unique_id} not found.")


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
            if user.username != game_room.admin.username:
                status = ERROR
                message = f"You are not the admin of this Game Room (Unique ID: {unique_id})."
            elif game_room.is_game_running:
                status = ERROR
                message = f"Game is already Running in this Game Room (Unique ID: {unique_id})"
            else:
                # Change is_game_running to True
                game_room.is_game_running = True
                game_room.save()

                # Preparing Card Deck
                cards = Card.objects.all()
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
