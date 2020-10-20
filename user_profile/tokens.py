from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import six

"""
    Six is a python library that makes the difference between the python versions smooth.
"""


class TokenGenerator(PasswordResetTokenGenerator):
    """
        Here we will generate a unique token to be sent as part of URL.
    """

    def _make_hash_value(self, user, timestamp):
        return (
            six.text_type(user.pk) + six.text_type(user.email) + six.text_type(timestamp) +
            six.text_type(user.is_active)
        )


account_activation_token = TokenGenerator()
