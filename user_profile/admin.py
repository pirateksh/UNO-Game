from django.contrib import admin
from .models import UserProfile


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_rating', 'current_league', 'maximum_rating',
                    'is_league_changed', 'is_email_verified', 'total_public_games_count', 'won_public_games_count',
                    'total_custom_games_count', 'won_custom_games_count', 'winning_streak']


admin.site.register(UserProfile, UserProfileAdmin)
