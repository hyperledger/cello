#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import status


def with_common_response(responses=None):
    if responses is None:
        responses = {}

    bad_request = (
        responses.get(status.HTTP_400_BAD_REQUEST)
        if status.HTTP_400_BAD_REQUEST in responses
        else "Bad Request"
    )
    responses.update(
        {
            status.HTTP_400_BAD_REQUEST: bad_request,
            status.HTTP_401_UNAUTHORIZED: "Permission denied",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Internal Error",
        }
    )

    return responses
