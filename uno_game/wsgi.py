"""
WSGI config for uno_game project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/wsgi/
"""


# Original and Working:-
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uno_game.settings')

application = get_wsgi_application()


# I ran collectstatic cmd using below version and it went well, so if u r facing issue with collectstatic consider below version once.
# import os

# from django.core.wsgi import get_wsgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uno_game.settings')

# application = get_wsgi_application()
# application = DjangoWhiteNoise(application)