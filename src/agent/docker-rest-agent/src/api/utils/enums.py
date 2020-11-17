import inspect
from enum import Enum, unique, EnumMeta

from django.conf import settings

ROLE_PREFIX = getattr(settings, "ROLE_PREFIX", "tea_cloud")


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


class ExtraEnum(Enum):
    @classmethod
    def get_info(cls, title="", list_str=False):
        str_info = """
        """
        str_info += title
        if list_str:
            for name, member in cls.__members__.items():
                str_info += """
            %s
            """ % (
                    name.lower().replace("_", "."),
                )
        else:
            for name, member in cls.__members__.items():
                str_info += """
            %s: %s
            """ % (
                    member.value,
                    name,
                )
        return str_info

    @classmethod
    def to_choices(cls, string_as_value=False):
        if string_as_value:
            choices = [
                (name.lower().replace("_", "."), name)
                for name, member in cls.__members__.items()
            ]
        else:
            choices = [
                (member.value, name)
                for name, member in cls.__members__.items()
            ]

        return choices

    @classmethod
    def values(cls):
        return list(map(lambda c: c.value, cls.__members__.values()))

    @classmethod
    def names(cls):
        return [name.lower() for name, _ in cls.__members__.items()]


@unique
class ErrorCode(Enum, metaclass=EnumWithDisplayMeta):
    Unknown = 20000
    ResourceNotFound = 20001
    CustomError = 20002
    ResourceExisted = 20003
    ValidationError = 20004
    ParseError = 20005

    class DisplayStrings:
        Unknown = "未知错误"
        ResourceNotFound = "资源未找到"
        CustomError = "自定义错误"
        ResourceExisted = "资源已经存在"
        ValidationError = "参数验证错误"
        ParseError = "解析错误"

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
