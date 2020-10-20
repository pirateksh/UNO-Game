from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfile(models.Model):

    # User whose profile is to be created.
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Whether Email has been verified or not
    is_email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username
