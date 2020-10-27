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
    return f"img/profile_avatars/{instance.user.username}/{filename}"
    # return 'profile_avatar/' + 'user_{0}/{1}'.format(instance.user.username, filename)


class UserProfile(models.Model):

    NOOBIE, EXPERT, CHAMPION, UNIVERSE_BOSS = "Noobie", "Expert", "Champion", "Universe Boss"
    # SUPER_NATURAL, AMATEUR, PUPIL, OP
    league_choices = (
        (NOOBIE, "Noobie"),
        (EXPERT, "Expert"),
        (CHAMPION, "Champion"),
        (UNIVERSE_BOSS, "Universe Boss"),
    )

    # User whose profile is to be created.
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # User's Avatar
    avatar = ProcessedImageField(
        default='default_male.jpg',
        upload_to=user_directory_path,
        processors=[ResizeToFill(100, 100)],
        # allow_empty_file=False,
        # validators=[MimetypeValidator('image/jpg')],
        options={'quality': 100},
        blank=True,
        null=True,
    )

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
    current_league = models.CharField(max_length=255, choices=league_choices, default=NOOBIE,
                                      verbose_name="Current League")

    current_rating = models.IntegerField(default=0, verbose_name="Current Rating")

    maximum_league = models.CharField(max_length=255, choices=league_choices, default=NOOBIE,
                                      verbose_name="Maximum League")

    maximum_rating = models.IntegerField(default=0, verbose_name="Maximum Rating")
    # maximum_league/rating = models.CharField()

    # image/avatar at assets/img/profile_images

    is_online = models.BooleanField(default=False, verbose_name="Is Online")

    def __str__(self):
        return self.user.username
