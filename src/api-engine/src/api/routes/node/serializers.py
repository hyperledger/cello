#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import serializers
from api.common.enums import (
    Operation,
    NetworkType,
    FabricNodeType,
    FabricVersions,
    HostType,
)
from api.common.serializers import PageQuerySerializer
from api.models import Node

LOG = logging.getLogger(__name__)


class NodeQuery(PageQuerySerializer):
    pass


class NodeCreateBody(serializers.ModelSerializer):
    agent_type = serializers.ChoiceField(
        help_text="Agent type",
        choices=HostType.to_choices(True),
        required=False,
    )

    class Meta:
        model = Node
        fields = (
            "network_type",
            "network_version",
            "type",
            "agent_type",
            "agent",
        )
        extra_kwargs = {
            "network_type": {"required": True},
            "network_version": {"required": True},
            "type": {"required": True},
        }

    def validate(self, attrs):
        network_type = attrs.get("network_type")
        node_type = attrs.get("type")
        network_version = attrs.get("network_version")
        agent_type = attrs.get("agent_type")
        agent = attrs.get("agent")
        if network_type == NetworkType.Fabric.name.lower():
            if network_version not in FabricVersions.values():
                raise serializers.ValidationError("Not valid fabric version")
            if node_type not in FabricNodeType.names():
                raise serializers.ValidationError(
                    "Not valid node type for %s" % network_type
                )

        if agent_type is None and agent is None:
            raise serializers.ValidationError("Please set agent_type or agent")

        if agent_type and agent:
            if agent_type != agent.type:
                raise serializers.ValidationError(
                    "agent type not equal to agent"
                )

        return attrs


class NodeIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="ID of node")


class NodeOperationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        help_text=Operation.get_info("Operation for node:", list_str=True),
        choices=Operation.to_choices(True),
    )
