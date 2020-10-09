from django.db import models
from django.conf import settings
import random
import string


def id_generator(size):
    """
        Function to generate Random ID of given size
    :param size: Size of Random ID
    :return: Random ID
    """
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(size))


class GameRoom(models.Model):

    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    unique_game_id = models.CharField(max_length=10, verbose_name="Unique ID", unique=True)

    def save(self, *args, **kwargs):
        self.unique_game_id = f"{id_generator(10)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.unique_game_id}_{self.admin.username}"


class Player(models.Model):

    player = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="Player")

    game_room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, verbose_name="Game Room")

    is_online = models.BooleanField(default=False, verbose_name="Is Online")

    def __str__(self):
        return self.player.username