import logging
import os

from django.conf import settings
from rest_framework import authentication
from rest_framework.permissions import BasePermission
from api.models import User, UserModel, Token
from django.core.exceptions import ObjectDoesNotExist
from keycloak import KeycloakOpenID
from datetime import datetime
from django.utils import timezone
from api.common.enums import UserRole

LOG = logging.getLogger(__name__)
TOKEN_INFO_URL = getattr(settings, "TOKEN_INFO_URL", "")
SUPER_USER_TOKEN = os.environ.get("ADMIN_TOKEN", "")
ADMIN_NAME = getattr(settings, "ADMIN_NAME", "Administrator")

SSO_ID = os.environ.get("SSO_ID", "api-service")
SSO_SECRET = os.environ.get("SSO_SECRET", "")
SSO_AUTH_URL = os.environ.get("SSO_AUTH_URL", "")
SSO_REALM = os.environ.get("SSO_REALM", "video-insight")

keycloak_openid = KeycloakOpenID(
    server_url=SSO_AUTH_URL,
    client_id=SSO_ID,
    realm_name=SSO_REALM,
    client_secret_key=SSO_SECRET,
    verify=False,
)


class CustomAuthenticate(authentication.BaseAuthentication):
    def authenticate(self, request):
        authorization = request.META.get("HTTP_AUTHORIZATION", None)
        if not authorization or not authorization.startswith("Bearer"):
            return None
        token = authorization.split(" ")[-1]
        if token == SUPER_USER_TOKEN:
            username = ADMIN_NAME
            user_model, _ = UserModel.objects.get_or_create(
                name=username, role=UserRole.Operator.name.lower()
            )
            role = UserRole.Operator.name.lower()
        else:
            try:
                token_model = Token.objects.get(
                    token=token, expire_date__gt=timezone.now()
                )
            except ObjectDoesNotExist:
                try:
                    token_info = keycloak_openid.introspect(token)
                    active = token_info.get("active", False)
                    role = token_info.get("role", UserRole.User.name.lower())
                    exp_time = timezone.make_aware(
                        datetime.fromtimestamp(token_info.get("exp"))
                    )
                    username = token_info.get("preferred_username", "")
                    sub = token_info.get("sub", "")
                    if not active:
                        return None
                except Exception as exc:
                    LOG.error("exception %s", str(exc))
                    return None
                user_model, _ = UserModel.objects.get_or_create(
                    id=sub, name=username
                )
                user_model.role = role
                user_model.save()
                token_model = Token(
                    token=token, user=user_model, expire_date=exp_time
                )
                token_model.save()
            else:
                username = token_model.user.name
                user_model = token_model.user
                role = user_model.role
        user = User()
        user.username = username
        user.token = token
        user.role = role
        user.user_model = user_model

        return user, None


class IsAdminAuthenticated(BasePermission):
    """
    Allows access only to authenticated users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.role == UserRole.Administrator.name.lower()
        )


class IsOperatorAuthenticated(BasePermission):
    """
    Allows access only to operators.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.role == UserRole.Operator.name.lower()
        )


class IsSuperUserAuthenticated(BasePermission):
    """
    Allows access only to authenticated users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_super_user
        )
