#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import status
from api.common.serializers import BadResponseSerializer


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
