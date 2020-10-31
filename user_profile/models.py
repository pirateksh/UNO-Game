from django.db import models
from django.contrib.auth import get_user_model

# 3rd party imports
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFill

User = get_user_model()


def user_directory_path(instance, filename):
    """
        A function to return path where image will be stored after uploading.
    """
    # File will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    ext = filename.split(".")[-1]
    # ext = "jpg"
    username = instance.user.username
    return f"img/profile_avatars/{username}/avatar_{username}.{ext}"


class UserProfile(models.Model):

    NOOBIE, AMATEUR, EXPERT, CHAMPION, UNIVERSE_BOSS = "Noobie", "Amateur", "Expert", "Champion", "Universe Boss"
    SUPER_NATURAL, OP = "Super Natural", "OP"

    league_choices = (
        (NOOBIE, "noobie"),
        (AMATEUR, "amateur"),
        (EXPERT, "expert"),
        (CHAMPION, "champion"),
        (SUPER_NATURAL, "super natural"),
        (UNIVERSE_BOSS, "universe boss"),
        (OP, "op"),
    )

    # User whose profile is to be created.
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # User's Avatar
    avatar = ProcessedImageField(
        default='default_male.jpg',
        upload_to=user_directory_path,
        processors=[ResizeToFill(100, 100)],
        format='JPEG',
        # allow_empty_file=False,
        # validators=[MimetypeValidator('image/jpg')],
        options={'quality': 100},
        blank=True,
        null=True,
    )

    # Whether Email has been verified or not
    is_email_verified = models.BooleanField(default=False)

    # # Total Number of games played
    # total_games_count = models.IntegerField(default=0, verbose_name="Count of Games Played")
    #
    # # Number of Games won by this player
    # won_games_count = models.IntegerField(default=0, verbose_name="Count of Games Won")

    # Total Number of public games played
    total_public_games_count = models.IntegerField(default=0, verbose_name="# of Public Games Played")

    # Number of public games won by this player
    won_public_games_count = models.IntegerField(default=0, verbose_name="# of Public Games Won")

    # Total Number of custom games played
    total_custom_games_count = models.IntegerField(default=0, verbose_name="# of Custom Games Played")

    # Number of public games won by this player
    won_custom_games_count = models.IntegerField(default=0, verbose_name="# of Custom Games Won")

    # # Number of rounds won by this player
    # won_rounds_count = models.IntegerField(default=0, verbose_name="Count of Rounds Won")

    # Winning streak of player.
    winning_streak = models.IntegerField(default=0, verbose_name="Winning Streak")

    # current_league/rating = models.CharField()
    current_league = models.CharField(max_length=255, choices=league_choices, default=NOOBIE,
                                      verbose_name="Current League")

    current_rating = models.IntegerField(default=500, verbose_name="Current Rating")

    # maximum_league = models.CharField(max_length=255, choices=league_choices, default=NOOBIE,
    #                                   verbose_name="Maximum League")

    maximum_rating = models.IntegerField(default=500, verbose_name="Maximum Rating")

    is_online = models.BooleanField(default=False, verbose_name="Is Online")

    LEAGUE_UPGRADED, LEAGUE_DEGRADED, LEAGUE_STABLE = 1, 2, 0
    is_league_changed_choices = (
        (LEAGUE_STABLE, "No"),
        (LEAGUE_UPGRADED, "Upgraded"),
        (LEAGUE_DEGRADED, "Degraded"),
    )

    is_league_changed = models.PositiveSmallIntegerField(default=LEAGUE_STABLE, choices=is_league_changed_choices,
                                                         verbose_name="Is League Changed")

    def __str__(self):
        return self.user.username

    RATING_THRESHOLDS = {
        NOOBIE: 1000,
        AMATEUR: 1700,
        EXPERT: 2500,
        CHAMPION: 3200,
        SUPER_NATURAL: 4000,
        UNIVERSE_BOSS: 5000,
        OP: 6200,
    }

    def get_current_league(self):
        rating = self.current_rating
        if rating < self.RATING_THRESHOLDS[self.NOOBIE]:
            return self.NOOBIE
        elif rating < self.RATING_THRESHOLDS[self.AMATEUR]:
            return self.AMATEUR
        elif rating < self.RATING_THRESHOLDS[self.EXPERT]:
            return self.EXPERT
        elif rating < self.RATING_THRESHOLDS[self.CHAMPION]:
            return self.CHAMPION
        elif rating < self.RATING_THRESHOLDS[self.SUPER_NATURAL]:
            return self.SUPER_NATURAL
        elif rating < self.RATING_THRESHOLDS[self.UNIVERSE_BOSS]:
            return self.UNIVERSE_BOSS
        elif rating < self.RATING_THRESHOLDS[self.OP]:
            return self.OP
