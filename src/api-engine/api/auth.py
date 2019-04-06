import logging
import os

from django.conf import settings
from rest_framework.permissions import BasePermission

from api.common.enums import UserRole

LOG = logging.getLogger(__name__)
TOKEN_INFO_URL = getattr(settings, "TOKEN_INFO_URL", "")
SUPER_USER_TOKEN = os.environ.get("ADMIN_TOKEN", "")
ADMIN_NAME = getattr(settings, "ADMIN_NAME", "Administrator")


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
