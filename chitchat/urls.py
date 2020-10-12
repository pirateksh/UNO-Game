from django.urls import path, re_path
from django.conf.urls import url
from . import views

urlpatterns = [
    path("", views.main, name='main_page'),
    path('<str:username>/', views.Chat.as_view(), name='chat'),
    # re_path(r"^(?P<username>[\w.@+-]+)", views.Chat.as_view()),
]
