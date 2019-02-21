from rest_framework.exceptions import APIException
from rest_framework import status
from api.common.enums import ErrorCode


class BadException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST


class ResourceExists(BadException):
    default_detail = ErrorCode.ResourceExists.display_string
    default_code = ErrorCode.ResourceExists.value


class ResourceNotFound(BadException):
    default_detail = ErrorCode.ResourceNotFound.display_string
    default_code = ErrorCode.ResourceNotFound.value


class ResourceInUse(BadException):
    default_detail = ErrorCode.ResourceInUse.display_string
    default_code = ErrorCode.ResourceInUse.value