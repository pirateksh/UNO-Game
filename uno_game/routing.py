from django.conf.urls import url
from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator


application = ProtocolTypeRouter({
    # Empty for now (http->django views is added by default)
    # 'websocket': AllowedHostsOriginValidator(
    #     AuthMiddlewareStack(
    #         URLRouter(
    #             [
    #                 path("messages/<str:username>", ChatConsumer),
    #                 # url(r"^messages/(?P<username>[\w.@+-]+)/$", ChatConsumer),
    #                 #  ws://domainname:<username>
    #             ]
    #         )
    #     )
    # )
})
