#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError, ParseError, APIException
from rest_framework.views import exception_handler

from api.common.enums import ErrorCode

LOG = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if (
        response.status_code == status.HTTP_400_BAD_REQUEST
        and "code" not in response.data
    ):
        if isinstance(exc, APIException):
            if isinstance(exc, ValidationError):
                response.data["code"] = ErrorCode.ValidationError.value
                response.data[
                    "message"
                ] = ErrorCode.ValidationError.display_string
            elif isinstance(exc, ParseError):
                response.data["code"] = ErrorCode.ParseError.value
                response.data["message"] = ErrorCode.ParseError.display_string
            else:
                response.data["code"] = ErrorCode.Unknown.value
                response.data["message"] = ErrorCode.Unknown.display_string
