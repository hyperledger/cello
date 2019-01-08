#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers
from api.common.enums import NetworkStatus, NetworkOperation, ChannelType


CHANNEL_NAME_MIN_LEN = 4
CHANNEL_NAME_MAX_LEN = 36


class NetworkQuery(serializers.Serializer):
    page = serializers.IntegerField(
        required=False, help_text="Page of filter", default=1, min_value=1
    )
    per_page = serializers.IntegerField(
        required=False,
        help_text="Per Page of filter",
        default=10,
        max_value=100,
    )
    status = serializers.ChoiceField(
        required=False,
        help_text=NetworkStatus.get_info(),
        choices=NetworkStatus.to_choices(),
    )


class NetworkResponse(serializers.Serializer):
    status = serializers.ChoiceField(
        help_text=NetworkStatus.get_info(), choices=NetworkStatus.to_choices()
    )


class NetworkListResponse(serializers.Serializer):
    total = serializers.IntegerField(help_text="Total number of networks")
    data = NetworkResponse(many=True)


class NodesSerializer(serializers.ListField):
    def __init__(self, *args, **kwargs):
        super(NodesSerializer, self).__init__(*args, **kwargs)
        self.help_text = "Nodes ID values"

    child = serializers.CharField(
        help_text="Node ID value", min_length=1, max_length=64
    )


class NetworkOperationBody(serializers.Serializer):
    action = serializers.ChoiceField(
        help_text=NetworkOperation.get_info(
            "Network Operations:", list_str=True
        ),
        choices=NetworkOperation.to_choices(True),
    )
    nodes = NodesSerializer()


class ChannelBody(serializers.Serializer):
    name = serializers.CharField(
        help_text="Channel Name",
        min_length=CHANNEL_NAME_MIN_LEN,
        max_length=CHANNEL_NAME_MAX_LEN,
    )


class ChannelCreateBody(ChannelBody):
    type = serializers.ChoiceField(
        help_text=ChannelType.get_info("Channel Types:", list_str=True),
        choices=ChannelType.to_choices(True),
    )


class ChannelID(serializers.Serializer):
    id = serializers.CharField(help_text="Channel ID")
