
from rest_framework import serializers

from api.models import Channel


class NodeSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    hosts = serializers.ListField(
        child=serializers.CharField(max_length=128)
    )


class ChannelCreateBody(serializers.Serializer):
    organization = serializers.UUIDField(help_text="ID of Organization")
    name = serializers.CharField(max_length=128, required=True)
    peers = NodeSerializer(many=True)
    orderers = NodeSerializer(many=True)


class ChannelIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="Channel ID")
