#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers

from api.common.enums import NetworkType, ConsensusPlugin, Operation
from api.common.serializers import PageQuerySerializer

NAME_MIN_LEN = 4
NAME_MAX_LEN = 36
NAME_HELP_TEXT = "Name of Cluster"
SIZE_MAX_VALUE = 6
SIZE_MIN_VALUE = 2


class ClusterQuery(PageQuerySerializer):
    consensus_plugin = serializers.ChoiceField(
        required=False,
        allow_null=True,
        help_text=ConsensusPlugin.get_info("Consensus Plugin:", list_str=True),
        choices=ConsensusPlugin.to_choices(True),
    )
    name = serializers.CharField(
        required=False,
        allow_null=True,
        min_length=NAME_MIN_LEN,
        max_length=NAME_MAX_LEN,
        help_text=NAME_HELP_TEXT,
    )
    host_id = serializers.CharField(
        help_text="Host ID", required=False, allow_null=True
    )
    network_type = serializers.ChoiceField(
        required=False,
        allow_null=True,
        help_text=NetworkType.get_info("Network Types:", list_str=True),
        choices=NetworkType.to_choices(True),
    )
    size = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=SIZE_MIN_VALUE,
        max_value=SIZE_MAX_VALUE,
        help_text="Size of cluster",
    )


class ClusterIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="ID of cluster")


class ClusterCreateBody(serializers.Serializer):
    name = serializers.CharField(
        min_length=NAME_MIN_LEN,
        max_length=NAME_MAX_LEN,
        help_text=NAME_HELP_TEXT,
    )
    host_id = serializers.CharField(help_text="Host ID")
    network_type = serializers.ChoiceField(
        help_text=NetworkType.get_info("Network Types:", list_str=True),
        choices=NetworkType.to_choices(True),
    )
    size = serializers.IntegerField(
        min_value=SIZE_MIN_VALUE,
        max_value=SIZE_MAX_VALUE,
        help_text="Size of cluster",
    )
    consensus_plugin = serializers.ChoiceField(
        help_text=ConsensusPlugin.get_info("Consensus Plugin:", list_str=True),
        choices=ConsensusPlugin.to_choices(True),
    )


class ClusterResponse(serializers.Serializer):
    name = serializers.CharField()


class ClusterOperationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        help_text=Operation.get_info("Operation for cluster:", list_str=True),
        choices=Operation.to_choices(True),
    )
