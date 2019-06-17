import logging
import os

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import authentication
from rest_framework.permissions import BasePermission

from api.common.enums import UserRole
from api.models import UserProfile

LOG = logging.getLogger(__name__)
TOKEN_INFO_URL = getattr(settings, "TOKEN_INFO_URL", "")
SUPER_USER_TOKEN = os.environ.get("ADMIN_TOKEN", "")
ADMIN_NAME = os.getenv("ADMIN_USERNAME")


class CustomAuthenticate(authentication.BaseAuthentication):
    def authenticate(self, request):
        authorization = request.META.get("HTTP_AUTHORIZATION", None)
        if not authorization or not authorization.startswith("JWT"):
            return None
        token = authorization.split(" ")[-1]
        if token == SUPER_USER_TOKEN:
            username = ADMIN_NAME
            try:
                user = UserProfile.objects.get(username=username)
            except ObjectDoesNotExist:
                return None

            return user, None
        else:
            return None


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
