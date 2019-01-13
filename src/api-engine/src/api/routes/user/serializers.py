#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers
from api.common.enums import Operation, NetworkType, NodeType
from api.common.serializers import PageQuerySerializer


class NodeQuery(PageQuerySerializer):
    pass


class NodeCreateBody(serializers.Serializer):
    network_type = serializers.ChoiceField(
        help_text=NetworkType.get_info("Network types:", list_str=True),
        choices=NetworkType.to_choices(True),
    )
    type = serializers.ChoiceField(
        help_text=NodeType.get_info("Node Types:", list_str=True),
        choices=NodeType.to_choices(True),
    )


class NodeIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="ID of node")


class NodeOperationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        help_text=Operation.get_info("Operation for node:", list_str=True),
        choices=Operation.to_choices(True),
    )
