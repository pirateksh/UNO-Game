from django.contrib import admin
from .models import GameRoom, Player, Card, PlayerHandCard, GameRoomDeckCard
# Register your models here.


class PlayerAdmin(admin.ModelAdmin):
    fields = ['player', 'is_online', 'game_room']


admin.site.register(GameRoom)
admin.site.register(Player, PlayerAdmin)
admin.site.register(Card)
admin.site.register(PlayerHandCard)
admin.site.register(GameRoomDeckCard)
