from django.shortcuts import render, redirect, HttpResponseRedirect, reverse
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth import get_user_model
from django.contrib import messages

from user_profile.models import UserProfile


def home_view(request):
    user = request.user
    if user.is_authenticated:
        user_profile_qs = UserProfile.objects.filter(user=user)
        if user_profile_qs:
            user_profile = user_profile_qs[0]
            if not user_profile.is_email_verified:
                messages.info(request, f"Your email is not verified.")
                return HttpResponseRedirect(reverse('user_profile', kwargs={"username": user.username}))
    return render(request, 'home/index.html', {})


User = get_user_model()


def signup(request):
    user = request.user
    # If user is already logged in.
    if user.is_authenticated:
        return HttpResponseRedirect(reverse('home'))

    if request.method == 'POST':
        username = request.POST['username']
        password1 = request.POST['password']
        password2 = request.POST['password_repeat']
        email = request.POST['email']
        first_name = request.POST['first_name']
        last_name = request.POST['last_name']

        if password1 != password2:
            messages.error(request, "Password did not match.")
            return redirect(request.path)

        users = User.objects.all()  # Signed-up users
        reg_email = []
        reg_username = []
        for user in users:
            reg_email.append(user.email)
            reg_username.append(user.username)

        if email in reg_email:
            messages.error(request, "Email already registered.")
            return redirect(request.path)
        if username in reg_username:
            messages.error(request, "Username Exists!!!")
            return redirect(request.path)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name
        )
        if user:
            user.save()
            user = authenticate(username=username, password=password1)

            # Note: UserProfile object is being created using django signals.

            if user:
                login(request, user)
                messages.error(request, "Sign Up successful! Verify Your Email to Continue!")
                return HttpResponseRedirect(reverse('user_profile', kwargs={"username": user.username}))
            else:
                messages.error(request, "Some error occurred Try logging-in again")
        else:
            messages.error(request, "Error occurred in Registration")
            return redirect(request.path)
    else:
        return render(request, 'home/signup.html', {})


def login_view(request):
    user = request.user
    # If user is already logged in.
    if user.is_authenticated:  # False only for AnonymousUser
        return HttpResponseRedirect(reverse('home'))

    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        remember_me = request.POST.get('remember_me', None)
        user = authenticate(username=username, password=password)
        if user is not None:
            user_profile = UserProfile.objects.get(user=user)
            if user_profile.is_email_verified:
                response = redirect(request.GET.get('next', 'home'))
            else:
                response = HttpResponseRedirect(reverse('user_profile', kwargs={'username': user.username}))
            user_profile.is_online = True;
            user_profile.save();
            login(request, user)
            if remember_me is None:
                if 'cook_user' and 'cook_pass' in request.COOKIES:
                    response.delete_cookie('cook_user')
                    response.delete_cookie('cook_pass')
                return response
            else:
                if 'cook_user' and 'cook_pass' not in request.COOKIES:
                    response.set_cookie('cook_user', username, max_age=86400, path='/')
                    response.set_cookie('cook_pass', password, max_age=86400, path='/')
                return response
        else:
            # print(type(request))
            # print(request.path)
            # print(request._get_full_path)
            # print(request.get_full_path())
            # print(request.get_full_path_info())
            messages.error(request, "Invalid Credentials")
            return redirect(request.path)
    else:
        return render(request, 'home/login.html', {})


def logout_view(request):
    user = request.user
    user_profile_instance = UserProfile.objects.get(user=user)
    user_profile_instance.is_online = False;
    user_profile_instance.save();
    logout(request)
    return redirect('home')
