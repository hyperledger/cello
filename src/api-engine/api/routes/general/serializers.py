#
# SPDX-License-Identifier: Apache-2.0
#
from abc import ABC

from rest_framework import serializers
from api.models import UserProfile


class RegisterBody(serializers.Serializer):
    orgName = serializers.CharField(help_text="name of Organization")
    username = serializers.CharField(help_text="name of Administrator", default="Administator")
    password = serializers.CharField(help_text="password of Administrator", default="666666")
    passwordAgain = serializers.CharField(help_text="password of Administrator")


class RegisterIDSerializer(serializers.Serializer):
    id = serializers.UUIDField(help_text="ID of Organization")

