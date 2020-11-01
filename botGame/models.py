from django.db import models
from django.contrib.auth.models import User


class BotModelManager(models.Manager):

    def get_bot_for_username(self, player_username):
        user_instance = User.objects.get(username=player_username) # getting the user instance for username=player_username
        try:
            queryset = Bot.objects.get(player_username=user_instance) # Searching bot for user_instance
            return queryset
        except:
            return None

    def create_bot_instance(self, player_username):
        player_instance = User.objects.get(username=player_username)
        bot_instance = self.model(
            player_username=player_instance,
        )
        bot_instance.save()
        return bot_instance


class Bot(models.Model):
    player_username = models.ForeignKey(User, on_delete=models.CASCADE) # player_username is actually an instance of the User class
    objects = BotModelManager()

    def __str__(self):
        return self.player_username

