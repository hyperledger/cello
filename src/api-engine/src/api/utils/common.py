#
# SPDX-License-Identifier: Apache-2.0
#
from drf_yasg import openapi
from rest_framework import status
from rest_framework import serializers
from rest_framework.permissions import BasePermission
from functools import reduce
from api.common.serializers import BadResponseSerializer
import uuid


def make_uuid():
    return str(uuid.uuid4())


def random_name(prefix=""):
    return "%s-%s" % (prefix, uuid.uuid4().hex)


def with_common_response(responses=None):
    if responses is None:
        responses = {}

    responses.update(
        {
            status.HTTP_400_BAD_REQUEST: BadResponseSerializer,
            status.HTTP_401_UNAUTHORIZED: "Permission denied",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Internal Error",
            status.HTTP_403_FORBIDDEN: "Authentication credentials "
            "were not provided.",
        }
    )

    return responses


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


def any_of(*perm_classes):
    """Returns permission class that allows access for
       one of permission classes provided in perm_classes"""

    class Or(BasePermission):
        def has_permission(*args):
            allowed = [p.has_permission(*args) for p in perm_classes]
            return reduce(lambda x, y: x or y, allowed)

    return Or
