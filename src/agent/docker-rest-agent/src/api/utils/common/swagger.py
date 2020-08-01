from drf_yasg import openapi
from rest_framework import serializers
from rest_framework import status

from api.utils.serializers import BadResponseSerializer

basic_type_info = [
    (serializers.CharField, openapi.TYPE_STRING),
    (serializers.BooleanField, openapi.TYPE_BOOLEAN),
    (serializers.IntegerField, openapi.TYPE_INTEGER),
    (serializers.FloatField, openapi.TYPE_NUMBER),
    (serializers.FileField, openapi.TYPE_FILE),
    (serializers.ImageField, openapi.TYPE_FILE),
]


def to_form_paras(self):
    custom_paras = []
    for field_name, field in self.fields.items():
        type_str = openapi.TYPE_STRING
        for field_class, type_format in basic_type_info:
            if isinstance(field, field_class):
                type_str = type_format
        help_text = getattr(field, "help_text")
        default = getattr(field, "default", None)
        required = getattr(field, "required")
        if callable(default):
            custom_paras.append(
                openapi.Parameter(
                    field_name,
                    openapi.IN_FORM,
                    help_text,
                    type=type_str,
                    required=required,
                )
            )
        else:
            custom_paras.append(
                openapi.Parameter(
                    field_name,
                    openapi.IN_FORM,
                    help_text,
                    type=type_str,
                    required=required,
                    default=default,
                )
            )
    return custom_paras


def with_common_response(responses=None):
    if responses is None:
        responses = {}

    responses.update(
        {
            status.HTTP_400_BAD_REQUEST: BadResponseSerializer,
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Internal Error",
        }
    )

    return responses
