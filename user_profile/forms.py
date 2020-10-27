from django import forms

# Imported Models
from .models import UserProfile


class AvatarUploadForm(forms.ModelForm):
    # Form to upload profile picture
    class Meta:
        model = UserProfile
        fields = ('avatar',)
