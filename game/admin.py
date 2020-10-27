from django.contrib import admin
from .models import GameRoom, Player, Card  # , PlayerHandCard, GameRoomDeckCard


class PlayerAdmin(admin.ModelAdmin):
    list_display = ['player', 'is_online', 'game_room']


class GameRoomAdmin(admin.ModelAdmin):
    list_display = ['unique_game_id', 'admin', 'joined_player_count', 'is_game_running']


class CardAdmin(admin.ModelAdmin):
    list_display = ['pk', 'category', 'number']


class PlayerHandCardAdmin(admin.ModelAdmin):
    pass


class GameRoomDeckCardAdmin(admin.ModelAdmin):
    list_display = ['game_room', 'card']


# admin.site.register(GameRoom, GameRoomAdmin)
# admin.site.register(Player, PlayerAdmin)
# admin.site.register(Card, CardAdmin)
# admin.site.register(PlayerHandCard, PlayerHandCardAdmin)
# admin.site.register(GameRoomDeckCard, GameRoomDeckCardAdmin)
