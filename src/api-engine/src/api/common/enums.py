#
# SPDX-License-Identifier: Apache-2.0
#
from enum import Enum, unique, EnumMeta
import inspect
from rest_framework import serializers


@unique
class NetworkStatus(Enum):
    Stopped = 0
    Running = 1
    Error = 2

    @classmethod
    def get_info(cls):
        task_status_str = """
        Status of network:
        """
        for name, member in cls.__members__.items():
            task_status_str += """
            %s: %s
            """ % (
                member.value,
                name,
            )
        return task_status_str

    @classmethod
    def to_choices(cls):
        choices = [
            (member.value, name) for name, member in cls.__members__.items()
        ]

        return choices


class EnumWithDisplayMeta(EnumMeta):
    def __new__(mcs, name, bases, attrs):
        display_strings = attrs.get("DisplayStrings")

        if display_strings is not None and inspect.isclass(display_strings):
            del attrs["DisplayStrings"]
            if hasattr(attrs, "_member_names"):
                attrs._member_names.remove("DisplayStrings")

        obj = super().__new__(mcs, name, bases, attrs)
        for m in obj:
            m.display_string = getattr(display_strings, m.name, None)

        return obj


@unique
class ErrorCode(Enum, metaclass=EnumWithDisplayMeta):
    ResourceExists = 20001
    NoAvailableResource = 20002
    ServiceBusy = 20003

    class DisplayStrings:
        ResourceExists = "Resource already exists."
        NoAvailableResource = "No available resource can be used."
        ServiceBusy = "Service is busy."

    @classmethod
    def get_info(cls):
        error_code_str = """
        Error Codes:
        """
        for name, member in cls.__members__.items():
            error_code_str += """
            %s: %s
            """ % (
                member.value,
                member.display_string,
            )

        return error_code_str


class BadResponseSerializer(serializers.Serializer):
    code = serializers.IntegerField(help_text=ErrorCode.get_info())
    message = serializers.CharField(
        required=False, help_text="Error Messages", allow_blank=True
    )
