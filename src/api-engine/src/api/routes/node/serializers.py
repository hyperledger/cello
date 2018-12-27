#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers
from api.common.enums import NetworkStatus


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
