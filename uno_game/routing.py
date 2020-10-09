from django.conf.urls import url
from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator

from game.consumers import GameRoomConsumer

application = ProtocolTypeRouter({
    # Empty for now (http->django views is added by default)
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                [
                    path("game/enter_room/<str:unique_id>/", GameRoomConsumer),
                    # path("messages/<str:username>", ChatConsumer),
                    #  ws://domainname:<username>
                ]
            )
        )
    )
})
