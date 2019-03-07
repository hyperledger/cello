#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers

from api.common.enums import Operation
from api.common.serializers import PageQuerySerializer
from api.models import Organization


class OrganizationQuery(PageQuerySerializer, serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("page", "per_page", "name")
        extra_kwargs = {"name": {"required": False}}


class OrganizationCreateBody(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("name",)
        extra_kwargs = {"name": {"required": True}}


class OrganizationResponse(serializers.ModelSerializer):
    id = serializers.UUIDField(help_text="ID of Organization")

    class Meta:
        model = Organization
        fields = ("id", "name", "created_at")
        extra_kwargs = {
            "name": {"required": True},
            "created_at": {"required": True, "read_only": False},
            "id": {"required": True, "read_only": False},
        }


class OrganizationList(serializers.Serializer):
    total = serializers.IntegerField(
        help_text="Total number of Organizations", default=0
    )
    data = OrganizationResponse(many=True, help_text="Organizations list")


class OrganizationIDSerializer(serializers.Serializer):
    id = serializers.UUIDField(help_text="ID of Organization")


class NodeOperationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        help_text=Operation.get_info("Operation for node:", list_str=True),
        choices=Operation.to_choices(True),
    )
