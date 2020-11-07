from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from django.dispatch import receiver
from .models import UserProfile

User = get_user_model()


@receiver(post_save, sender=User)  # takes signal:post_save and sender as arguments
def create_profile(sender, instance, created, **kwargs):
    if created:
        if instance.has_usable_password():
            UserProfile.objects.create(user=instance)
        else:
            # If user signed - up using social login
            UserProfile.objects.create(user=instance, is_email_verified=True)

# @receiver(post_save, sender=User)
# def save_profile(sender, instance, **kwargs):
#     instance.userprofile.save()  # i.e. instance(which is user here).modelname.save()
