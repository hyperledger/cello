#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.utils import six
from django.utils.translation import ugettext_lazy as _

from rest_framework import exceptions, status
from rest_framework.response import Response

LOG = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    if isinstance(exc, exceptions.APIException):
        headers = {}
        if context.get("view").request_id:
            headers["X-Request-ID"] = context.get("view").request_id
        if getattr(exc, "auth_header", None):
            headers["WWW-Authenticate"] = exc.auth_header
        if getattr(exc, "wait", None):
            headers["Retry-After"] = "%d" % exc.wait

        if isinstance(exc.detail, (list, dict)):
            data = exc.detail
        else:
            data = {"detail": exc.detail}

        return Response(data, status=exc.status_code, headers=headers)

    elif isinstance(exc, Http404):
        msg = _("Not found.")
        data = {"detail": six.text_type(msg)}

        return Response(data, status=status.HTTP_404_NOT_FOUND)

    elif isinstance(exc, PermissionDenied):
        msg = _("Permission denied.")
        data = {"detail": six.text_type(msg)}

        return Response(data, status=status.HTTP_403_FORBIDDEN)
