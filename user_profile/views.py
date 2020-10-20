from django.shortcuts import render, get_object_or_404, HttpResponse, HttpResponseRedirect, reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages

# Importing token
from .tokens import account_activation_token

from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

# Import for sending mail
from django.core import mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


from game.models import GameRoom, Player
from .models import UserProfile

User = get_user_model()


def user_profile_view(request, username):
    if request.user.username != username:
        return HttpResponse(f"Other Profile Access try for user: {username}, by user: {request.user.username}")
    user = get_object_or_404(User, username=username)
    if user.is_authenticated:
        user_game_room_qs = GameRoom.objects.filter(admin=user)
        other_game_room_qs = GameRoom.objects.exclude(admin=user)
        player_qs = Player.objects.filter(player=user)
        joined_game_rooms = []
        for player in player_qs:
            joined_game_rooms.append(player.game_room)
        context = {
            'user_game_rooms': user_game_room_qs,
            'other_game_rooms': other_game_room_qs,
            'joined_game_rooms': joined_game_rooms,
        }
        return render(request, 'user_profile/profile.html', context=context)
    else:
        return HttpResponse(f"Oops! User with username {username} not found!")


@login_required
def verify_email(request, username):
    """
        This function sends a verification link to your email.
    """
    requested_user = get_object_or_404(User, username=username)
    user = request.user
    if user == requested_user:
        email = requested_user.email
        host = request.get_host()
        subject = 'Activate your UNO Game account.'

        email_context = {
            'user': user,
            'host': host,
            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
            'token': account_activation_token.make_token(user),
        }
        html_message = render_to_string('user_profile/mail_template_email_verification.html', context=email_context)
        plain_message = strip_tags(html_message)

        from_email = "noreply@django_unchained"
        to = str(email)
        try:
            mail.send_mail(subject, plain_message, from_email, [to], html_message=html_message)
        except mail.BadHeaderError:
            messages.info(request, f"Invalid Header found, mail not sent!")

        return HttpResponse('Please confirm your email address to complete the registration.')
    messages.info(request, f"You are not authorised to visit this page.")
    return HttpResponseRedirect(reverse('home'))


def activate(request, uidb64, token):
    """
        A function that verifies email through activation link.
    """
    try:
        uid = force_text(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except(TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user is not None and account_activation_token.check_token(user, token):
        if request.user == user:
            if user.is_authenticated:
                profile = UserProfile.objects.get(user=user)

                profile.is_email_verified = True
                profile.save()

                messages.success(request, f"Your email has been verified.")
                return HttpResponseRedirect(reverse('home'))
            messages.success(request, f"Login to verify email.")
            return HttpResponseRedirect(reverse('home'))
    return HttpResponse('Activation link is invalid!')
