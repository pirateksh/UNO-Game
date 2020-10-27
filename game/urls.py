from django.urls import path, include
from . import views

urlpatterns = [
    # path('join_room/<str:unique_id>/', views.join_game_room, name="join_game_room"),
    path('enter_room/<str:game_type>/<str:unique_id>/', views.enter_game_room, name="enter_game_room"),
    # path('create/', views.create_game_room, name="create_game_room"),

    path('play_now/', views.play_now, name="play_now"),
    path('friend/enter_room/', views.enter_friend_play, name="enter_friend_play"),
    path('public/enter_room/', views.enter_public_play, name="enter_public_play"),

    path('bot_game/', include('botGame.urls')),
]
