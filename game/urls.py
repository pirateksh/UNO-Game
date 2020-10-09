from django.urls import path
from . import views

urlpatterns = [
    path('join_room/<str:unique_id>/', views.join_game_room, name="join_game_room"),
    path('enter_room/<str:unique_id>/', views.enter_game_room, name="enter_game_room"),
    path('create/', views.create_game_room, name="create_game_room"),
]
