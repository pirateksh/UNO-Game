from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_game_room, name="create_game_room"),
]
