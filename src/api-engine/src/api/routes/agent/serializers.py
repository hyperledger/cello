#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import serializers
from api.common.enums import NetworkStatus, LogLevel, HostType
from api.common.serializers import PageQuerySerializer, ListResponseSerializer

NameHelpText = "Name of Agent"
WorkerApiHelpText = "API address of worker"
IDHelpText = "ID of Agent"
CapacityHelpText = "Capacity of Agent"

NameMinLen = 4
NameMaxLen = 36
WorkerAPIMinLen = 6
WorkerAPIMaxLen = 128
CapacityMinValue = 1


class AgentQuery(PageQuerySerializer):
    status = serializers.ChoiceField(
        required=False,
        help_text=NetworkStatus.get_info(),
        choices=NetworkStatus.to_choices(),
    )


class AgentIDSerializer(serializers.Serializer):
    id = serializers.CharField(help_text=IDHelpText)


class AgentCreateBody(serializers.Serializer):
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
        help_text=HostType.get_info("Agent types:"),
    )


class AgentPatchBody(serializers.Serializer):
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


class AgentUpdateBody(AgentPatchBody):
    status = serializers.ChoiceField(
        required=False,
        allow_null=True,
        help_text=NetworkStatus.get_info(),
        choices=NetworkStatus.to_choices(),
    )


class AgentResponse(AgentIDSerializer, AgentCreateBody):
    status = serializers.ChoiceField(
        help_text=NetworkStatus.get_info(), choices=NetworkStatus.to_choices()
    )
    created_at = serializers.DateTimeField(help_text="Create time")
    schedulable = serializers.BooleanField(
        help_text="Whether agent can be schedulable"
    )


class AgentListResponse(ListResponseSerializer):
    data = AgentResponse(many=True, help_text="Agents data")
