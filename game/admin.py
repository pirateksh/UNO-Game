from django.contrib import admin
from .models import GameRoom, Player
# Register your models here.


class PlayerAdmin(admin.ModelAdmin):
    fields = ['player', 'is_online', 'game_room']


admin.site.register(GameRoom)
admin.site.register(Player, PlayerAdmin)