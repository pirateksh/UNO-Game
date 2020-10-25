from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfile(models.Model):

    NOOBIE, EXPERT, CHAMPION, UNIVERSE_BOSS = 1, 2, 3, 4
    # SUPER_NATURAL, AMATEUR, PUPIL, OP
    league_choices = (
        (NOOBIE, "Noobie"),
        (EXPERT, "Expert"),
        (CHAMPION, "Champion"),
        (UNIVERSE_BOSS, "Universe Boss"),
    )

    # User whose profile is to be created.
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Whether Email has been verified or not
    is_email_verified = models.BooleanField(default=False)

    # Total Number of games played
    total_games_count = models.IntegerField(default=0, verbose_name="Count of Games Played")

    # Number of Games won by this player
    won_games_count = models.IntegerField(default=0, verbose_name="Count of Games Won")

    # Number of rounds won by this player
    won_rounds_count = models.IntegerField(default=0, verbose_name="Count of Rounds Won")

    # Winning streak of player.
    winning_streak = models.IntegerField(default=0, verbose_name="Winning Streak")

    # current_league/rating = models.CharField()
    current_league = models.IntegerField(choices=league_choices, default=NOOBIE, verbose_name="Current League")

    maximum_league = models.IntegerField(choices=league_choices, default=NOOBIE, verbose_name="Maximum League")

    # maximum_league/rating = models.CharField()

    # image/avatar at assets/img/profile_images

    is_online = models.BooleanField(default=False, verbose_name="Is Online")

    def __str__(self):
        return self.user.username
