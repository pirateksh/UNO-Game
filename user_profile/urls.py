from django.urls import path
from . import views

urlpatterns = [
    path('visit/<str:username>', views.user_profile_view, name='user_profile')
]
