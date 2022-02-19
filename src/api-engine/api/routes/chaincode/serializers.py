from rest_framework import serializers
from api.config import FABRIC_CHAINCODE_STORE

from api.models import ChainCode
from api.common.serializers import ListResponseSerializer
import hashlib


def upload_to(instance, filename):
    return '/'.join([FABRIC_CHAINCODE_STORE, instance.user_name, filename])


class ChainCodeIDSerializer(serializers.Serializer):
    id = serializers.UUIDField(help_text="ChainCode ID")


class ChainCodePackageBody(serializers.Serializer):
    name = serializers.CharField(max_length=128, required=True)
    version = serializers.CharField(max_length=128, required=True)
    language = serializers.CharField(max_length=128, required=True)
    md5 = serializers.CharField(max_length=128, required=True)
    file = serializers.FileField()

    def validate(self, attrs):
        md5_get = self.md5_for_file(attrs["file"])
        if md5_get != attrs["md5"]:
            raise serializers.ValidationError("md5 not same.")
        return super().validate(attrs)

    @staticmethod
    def md5_for_file(chunks):
        md5 = hashlib.md5()
        for data in chunks:
            md5.update(data)
        return md5.hexdigest()


class ChainCodeNetworkSerializer(serializers.Serializer):
    id = serializers.UUIDField(help_text="Network ID")
    name = serializers.CharField(max_length=128, help_text="name of Network")


class ChainCodeOrgListSerializer(serializers.Serializer):
    id = serializers.UUIDField(help_text="Organization ID")
    name = serializers.CharField(
        max_length=128, help_text="name of Organization")


class ChainCodeResponseSerializer(ChainCodeIDSerializer, serializers.ModelSerializer):
    id = serializers.UUIDField(help_text="ID of ChainCode")
    # network = ChainCodeNetworkSerializer()
    # organizations = ChainCodeOrgListSerializer(many=True)

    class Meta:
        model = ChainCode
        fields = ("id", "name", "version", "creator", "language", "create_ts", "md5")


class ChaincodeListResponse(ListResponseSerializer):
    data = ChainCodeResponseSerializer(many=True, help_text="ChianCode data")


class ChainCodeApproveForMyOrgBody(serializers.Serializer):
    channel_name = serializers.CharField(max_length=128, required=True)
    chaincode_name = serializers.CharField(max_length=128, required=True)
    chaincode_version = serializers.CharField(max_length=128, required=True)
    policy = serializers.CharField(max_length=128, required=True)
    orderer_url = serializers.CharField(max_length=128, required=True)
    sequence = serializers.IntegerField(min_value=1, required=True)


class ChainCodeCommitBody(ChainCodeApproveForMyOrgBody):
    peer_list = serializers.ListField(allow_empty=False,required=True)

