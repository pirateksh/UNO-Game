from django.urls import path, include
from . import views

urlpatterns = [
    path('start_game/<str:unique_id>/', views.start_game, name="start_game"),
    path('end_game/<str:unique_id>/', views.end_game, name="end_game"),
    path('join_room/<str:unique_id>/', views.join_game_room, name="join_game_room"),
    path('enter_room/<str:unique_id>/', views.enter_game_room, name="enter_game_room"),
    path('create/', views.create_game_room, name="create_game_room"),
    path('bot_game/', include('botGame.urls')),

    # Can only be accessed by superuser
    path('add_cards/', views.add_cards, name="add_cards"),
]
