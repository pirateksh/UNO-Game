from django.contrib import admin
from django.urls import path, include
from django.conf.urls import url
from django.contrib.auth import views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('home.urls')),
    path('game/', include('game.urls')),
    path('user_profile/', include('user_profile.urls')),

    # Account URLS
    url(r'^password_reset/$', views.PasswordResetView.as_view(), name='password_reset'),
    url(r'^password_reset/done/$', views.PasswordResetDoneView.as_view(), name='password_reset_done'),

    # Below commented URL was giving No Reverse Found Error probably due ro regex expression.
    # url(r'^reset/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
    #     views.PasswordResetConfirmView.as_view(),
    #     name='password_reset_confirm'),

    path('reset/<str:uidb64>/<str:token>/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    url(r'^reset/done/$', views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),

]
