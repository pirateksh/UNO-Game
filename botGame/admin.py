from django.contrib import admin

# Register your models here.
from .models import Bot


class BotAdmin(admin.ModelAdmin):
    model = Bot
    list_display = ['id', 'player_username']


admin.site.register(Bot, BotAdmin)
