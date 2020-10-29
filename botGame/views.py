from django.shortcuts import render, redirect
from django.http import Http404, HttpResponse

from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required

from .models import Bot

@login_required()
def bot_game(request):
    player_username = request.user.username

    bot_instance = Bot.objects.get_bot_for_username(player_username)

    if bot_instance is None:
        bot_instance = Bot.objects.create_bot_instance(player_username)

    context = {
        'bot': bot_instance.id,
    }
    return render(request, 'botGame/bot_game.html', context)
    # return render(request, 'botGame/bot_game_old.html', context)