import logging

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()
LOG = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="username")

    class Meta:
        model = User
        fields = ("id",)
        extra_kwargs = {"id": {"validators": []}}


def jwt_response_payload_handler(token, user=None, request=None):
    return {
        "token": token,
        "user": UserSerializer(user, context={"request": request}).data,
    }


def jwt_get_username_from_payload_handler(payload):
    """
    Override this function if username is formatted differently in payload
    """
    return payload.get("sub")
