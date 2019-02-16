#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers

from api.common.enums import Operation
from api.common.serializers import PageQuerySerializer
from api.models import Govern

COMPANY_NAME_MIN_LEN = 4
COMPANY_NAME_MAX_LEN = 64


class GovernQuery(PageQuerySerializer, serializers.ModelSerializer):
    class Meta:
        model = Govern
        fields = ("page", "per_page", "name")
        extra_kwargs = {"name": {"required": False}}


class GovernCreateBody(serializers.ModelSerializer):
    class Meta:
        model = Govern
        fields = ("name",)
        extra_kwargs = {"name": {"required": True}}


class GovernResponse(serializers.ModelSerializer):
    id = serializers.UUIDField(help_text="ID of govern")

    class Meta:
        model = Govern
        fields = ("id", "name", "created_at")
        extra_kwargs = {
            "name": {"required": True},
            "created_at": {"required": True, "read_only": False},
            "id": {"required": True, "read_only": False},
        }


class GovernList(serializers.Serializer):
    total = serializers.IntegerField(
        help_text="Total number of governs", default=0
    )
    data = GovernResponse(many=True, help_text="Governs list")


class GovernIDSerializer(serializers.Serializer):
    id = serializers.UUIDField(help_text="ID of govern")


class NodeOperationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        help_text=Operation.get_info("Operation for node:", list_str=True),
        choices=Operation.to_choices(True),
    )
