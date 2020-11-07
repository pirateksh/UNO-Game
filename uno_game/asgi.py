import os
import django

# from django.core.asgi import get_asgi_application
from channels.routing import get_default_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uno_game.settings')

django.setup()
# application = get_asgi_application()
application = get_default_application()
