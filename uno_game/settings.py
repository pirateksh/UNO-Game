from decouple import config # Using python-decouple library
from pathlib import Path
import os
# import redis

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default="SOME+RANDOM+BACKUPKEz9+3vnmjb0u@&w68t#5_e8s9-lbfhv-")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default="")

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'game.apps.GameConfig',
    'home.apps.HomeConfig',
    'user_profile.apps.UserProfileConfig',
    'chitchat.apps.ChitchatConfig',
    'botGame.apps.BotgameConfig',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 3rd Party Libraries
    'channels',
    'social_django',  # Social Media Login
    'imagekit',
]

MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Added for deployment
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    # Middleware to handle Login through Social Media Platform requests
    'social_django.middleware.SocialAuthExceptionMiddleware'
]

ROOT_URLCONF = 'uno_game.urls'
ASGI_APPLICATION = "uno_game.routing.application"

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.media',  # To access Media URL in templates
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',


                # Context Preprocessors for Social media login
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect'

            ],
        },
    },
]

# WSGI_APPLICATION = 'uno_game.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

import dj_database_url
db_from_env = dj_database_url.config()
DATABASES['default'].update(db_from_env)
DATABASES['default']['CONN_MAX_AGE'] = 500


# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/


PROJECT_ROOT = os.path.join(os.path.abspath(__file__))
STATIC_URL = '/static/'
STATIC_ROOT = 'static'
# STATIC_ROOT = os.path.join(PROJECT_ROOT, 'static')

# Settings for uploading Media (User's Avatar)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
# os.path.join(BASE_DIR, 'media')

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'assets'),
)

#  Add configuration for static files storage using whitenoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
# r = redis.from_url(os.environ.get("REDIS_URL", 'redis://localhost:6379'))
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            # "hosts": [("127.0.0.1", 6379)],
            # Below commented line to be used in case of Production (Example: heroku)
            "hosts": [os.environ.get('REDIS_URL', 'redis://localhost:6379')],
            # "hosts": [config('REDIS_URL', default="redis://localhost:6379")]
        },
        "symmetric_encryption_keys": [SECRET_KEY],
    },
}

# CACHES = {
#     "default": {
#          "BACKEND": "redis_cache.RedisCache",
#          "LOCATION": os.environ.get('REDIS_URL'),
#     }
# }

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',  # Default Django Authentication Backend
    'social_core.backends.github.GithubOAuth2',  # for Github authentication
    'social_core.backends.facebook.FacebookOAuth2',  # for Facebook authentication
    'social_core.backends.open_id.OpenIdAuth',  # for Google authentication
    'social_core.backends.google.GoogleOpenId',  # for Google authentication
    'social_core.backends.google.GoogleOAuth2',  # for Google authentication
    'home.models.EmailBackend',  # Enables Login using Email as well as username
)

SOCIAL_AUTH_GITHUB_KEY = config('SOCIAL_AUTH_GITHUB_KEY', default="")
SOCIAL_AUTH_GITHUB_SECRET = config('SOCIAL_AUTH_GITHUB_SECRET', default="")

SOCIAL_AUTH_FACEBOOK_KEY = config('SOCIAL_AUTH_FACEBOOK_KEY', default="")
SOCIAL_AUTH_FACEBOOK_SECRET = config('SOCIAL_AUTH_FACEBOOK_SECRET', default="")

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = config('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY', default="")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = config('SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET', default="")

LOGIN_URL = 'login'
LOGOUT_URL = 'logout'
LOGIN_REDIRECT_URL = 'home'

# Email Setup
EMAIL_HOST = config('EMAIL_HOST', default="")
EMAIL_PORT = config('EMAIL_PORT', default="")
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default="")
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default="")
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)

# Peer JS Server
PEER_JS_HOST_NAME = config('PEER_JS_HOST_NAME', default="/")
PEER_JS_PORT_NUMBER = config('PEER_JS_PORT_NUMBER', default="8001")

WINNING_THRESHOLD_SCORE = int(config('WINNING_THRESHOLD_SCORE', default="100"))
