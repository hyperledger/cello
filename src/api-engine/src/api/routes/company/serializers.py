#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers

from api.common.enums import Operation
from api.common.serializers import PageQuerySerializer

COMPANY_NAME_MIN_LEN = 4
COMPANY_NAME_MAX_LEN = 64


class CompanyQuery(PageQuerySerializer):
    pass


class CompanyCreateBody(serializers.Serializer):
    name = serializers.CharField(
        help_text="Company Name",
        min_length=COMPANY_NAME_MIN_LEN,
        max_length=COMPANY_NAME_MAX_LEN,
    )


class CompanyIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="ID of node")


class NodeOperationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        help_text=Operation.get_info("Operation for node:", list_str=True),
        choices=Operation.to_choices(True),
    )
