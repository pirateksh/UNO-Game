from django.contrib import admin
from .models import UserProfile


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_email_verified']


admin.site.register(UserProfile, UserProfileAdmin)