from django.conf.urls import url
from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator

from game.consumers import GameRoomConsumer
from chitchat.consumers import ChatConsumer
from botGame.consumers import BotGameConsumer

application = ProtocolTypeRouter({
    # Empty for now (http->django views is added by default)
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                [
                    #  ws://domainname:<username>
                    path("game/enter_room/<str:unique_id>/", GameRoomConsumer),
                    url(r"^chitchat/(?P<username>[\w.@+-]+)/$", ChatConsumer),
                    url(r"^game/bot_game/", BotGameConsumer),
                ]
            )
        )
    )
})
