
from rest_framework import serializers

from api.models import Channel
from api.common.serializers import ListResponseSerializer


class ChannelCreateBody(serializers.Serializer):
    #organization = serializers.UUIDField(help_text="ID of Organization")
    name = serializers.CharField(max_length=128, required=True)
    peers = serializers.ListField(
        child=serializers.UUIDField(help_text="ID of Peer Nodes")
    )
    orderers = serializers.ListField(
        child=serializers.UUIDField(help_text="ID of Orderer Nodes")
    )


class ChannelIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="Channel ID")


class ChannelUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Channel
        fields = (
            "name",
        )


class ChannelResponseSerializer(ChannelIDSerializer, serializers.ModelSerializer):
    network = serializers.UUIDField(help_text="ID of Network")
    organizations = serializers.ListField(
        child=serializers.UUIDField(help_text="ID of Organization")
    )

    class Meta:
        model = Channel
        fields = ("name", "network", "organizations", "create_ts")


class ChannelListResponse(ListResponseSerializer):
    data = ChannelResponseSerializer(many=True, help_text="Channel data")
