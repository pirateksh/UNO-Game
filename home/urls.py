
from django.urls import path, include
from django.conf.urls import url
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('signup/', views.signup, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # this url is handled by social_django app under social-auth-app-django python library
    url(r'^oauth/', include('social_django.urls', namespace='social')),
]
