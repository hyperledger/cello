import base64
import json
import logging

from django.contrib.auth import get_user_model
from django.utils.translation import ugettext as _
from rest_framework import authentication
from rest_framework import exceptions
from rest_framework_jwt.authentication import (
    JSONWebTokenAuthentication as CoreJSONWebTokenAuthentication,
)
from rest_framework_jwt.settings import api_settings

jwt_decode_handler = api_settings.JWT_DECODE_HANDLER
jwt_get_username_from_payload = api_settings.JWT_PAYLOAD_GET_USERNAME_HANDLER
User = get_user_model()

LOG = logging.getLogger(__name__)


class JSONWebTokenAuthentication(CoreJSONWebTokenAuthentication):
    @staticmethod
    def _get_or_create_user(user_id, payload=None):
        if payload is None:
            payload = {}

        user, _ = User.objects.get_or_create(
            id=user_id, username=user_id, defaults={"password": user_id}
        )

        return user

    def authenticate_credentials(self, payload):
        """
        Returns an active user that matches the payload's user id and email.
        """
        username = jwt_get_username_from_payload(payload)

        if not username:
            msg = _("Invalid payload.")
            raise exceptions.AuthenticationFailed(msg)

        user = self._get_or_create_user(username, payload)

        if not user.is_active:
            msg = _("User account is disabled.")
            raise exceptions.AuthenticationFailed(msg)

        return user


class IstioJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        token = request.META.get("HTTP_TOKEN", None)
        if token is None:
            return None

        token += "=" * (-len(token) % 4)
        token = base64.b64decode(token)
        token = json.loads(token)
        user_id = token.get("sub", None)
        if user_id is None:
            return None
        user, _ = User.objects.get_or_create(
            id=user_id, username=user_id, defaults={"password": user_id}
        )
        return user, None
