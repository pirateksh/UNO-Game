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
        return f"P:{self.player.username}_G:{self.game_room}"


"""
    card (cardid, category, number)
    deck (deckid, gameroomid)
    deckcard (deckcardid, deckid, cardid)
    hand (handid, playerid)
    handcard (handcardid, handid, cardid)
"""


class Card(models.Model):
    """
        Model Representing all Cards of UNO.
    """
    RED = "R"
    BLUE = "B"
    GREEN = "G"
    YELLOW = "Y"
    WILD = "W"
    WILD_FOUR = "WF"

    category_options = (
        (RED, "Red"),
        (BLUE, "Blue"),
        (GREEN, "Green"),
        (YELLOW, "Yellow"),
        (WILD, "Wild"),
        (WILD_FOUR, "Wild Four"),
    )

    category = models.CharField(max_length=2, choices=category_options, verbose_name="Color")

    ZERO, ONE, TWO, THREE, FOUR = 0, 1, 2, 3, 4
    FIVE, SIX, SEVEN, EIGHT, NINE = 5, 6, 7, 8, 9
    SKIP, DRAW_TWO, REVERSE = 10, 11, 12

    number_option = (
        (ZERO, "Zero"), (ONE, "One"), (TWO, "Two"), (THREE, "Three"), (FOUR, "Four"),
        (FIVE, "Five"), (SIX, "Six"), (SEVEN, "Seven"), (EIGHT, "Eight"), (NINE, "Nine"),
        (SKIP, "Skip"), (DRAW_TWO, "Draw Two"), (REVERSE, "Reverse"),
    )
    number = models.PositiveSmallIntegerField(choices=number_option, verbose_name="Number")

    def __str__(self):
        return f"{self.category}_{self.number}"


# class Deck(models.Model):
#     """
#         Model Representing a Deck specific to particular Game Room.
#     """
#     game_room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, verbose_name="Game Room")
#
#     def __str__(self):
#         return f"deck_{self.game_room.unique_game_id}"


class GameRoomDeckCard(models.Model):
    """
        Model storing the Card specific to a GameRoom's Deck.
    """
    # deck = models.ForeignKey(Deck, on_delete=models.CASCADE, verbose_name="Deck")
    game_room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, verbose_name="Game Room")

    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="Card")

    def __str__(self):
        # return f"deckcard_{self.card}_{self.deck}"
        return f"gameroomcard_{self.card}"


# class Hand(models.Model):
#     """
#         Model Representing Hand specific to Player.
#     """
#     player = models.ForeignKey(Player, on_delete=models.CASCADE, verbose_name="Player")
#
#     def __str__(self):
#         return f"hand_{self.player}"


class PlayerHandCard(models.Model):
    """
        Model Representing Card specific to a Player's Hand.
    """
    # hand = models.ForeignKey(Hand, on_delete=models.CASCADE, verbose_name="Hand")
    player = models.ForeignKey(Player, on_delete=models.CASCADE, verbose_name="Player")

    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="Card")

    def __str__(self):
        # return f"handcard_{self.hand}_{self.card}"
        return f"playerhandcard_{self.player}_{self.card}"
