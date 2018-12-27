#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers
from api.common.enums import NetworkStatus, LogLevel, HostType
from api.common.serializers import PageQuerySerializer, ListResponseSerializer

NameHelpText = "Name of Host"
WorkerApiHelpText = "API address of worker"
IDHelpText = "ID of Host"
CapacityHelpText = "Capacity of Host"

NameMinLen = 4
NameMaxLen = 36
WorkerAPIMinLen = 6
WorkerAPIMaxLen = 128
CapacityMinValue = 1


class HostQuery(PageQuerySerializer):
    status = serializers.ChoiceField(
        required=False,
        help_text=NetworkStatus.get_info(),
        choices=NetworkStatus.to_choices(),
    )


class HostIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text=IDHelpText)


class HostCreateBody(serializers.Serializer):
    name = serializers.CharField(
        min_length=NameMinLen, max_length=NameMaxLen, help_text=NameHelpText
    )
    worker_api = serializers.CharField(
        min_length=WorkerAPIMinLen,
        max_length=WorkerAPIMaxLen,
        help_text=WorkerApiHelpText,
    )
    capacity = serializers.IntegerField(
        min_value=CapacityMinValue, help_text=CapacityHelpText
    )
    log_level = serializers.ChoiceField(
        choices=LogLevel.to_choices(),
        help_text=LogLevel.get_info("Log levels:"),
    )
    type = serializers.ChoiceField(
        choices=HostType.to_choices(),
        help_text=HostType.get_info("Host types:"),
    )


class HostPatchBody(serializers.Serializer):
    name = serializers.CharField(
        min_length=NameMinLen,
        max_length=NameMaxLen,
        help_text=NameHelpText,
        required=False,
        allow_null=True,
    )
    capacity = serializers.IntegerField(
        min_value=CapacityMinValue,
        required=False,
        allow_null=True,
        help_text=CapacityHelpText,
    )
    log_level = serializers.ChoiceField(
        choices=LogLevel.to_choices(),
        required=False,
        allow_null=True,
        help_text=LogLevel.get_info("Log levels:"),
    )


class HostUpdateBody(HostPatchBody):
    status = serializers.ChoiceField(
        required=False,
        allow_null=True,
        help_text=NetworkStatus.get_info(),
        choices=NetworkStatus.to_choices(),
    )


class HostResponse(HostIDSerializer, HostCreateBody):
    status = serializers.ChoiceField(
        help_text=NetworkStatus.get_info(), choices=NetworkStatus.to_choices()
    )
    created_at = serializers.DateTimeField(help_text="Create time")
    schedulable = serializers.BooleanField(
        help_text="Whether hos can be schedulable"
    )


class HostListResponse(ListResponseSerializer):
    data = HostResponse(many=True, help_text="Hosts data")
