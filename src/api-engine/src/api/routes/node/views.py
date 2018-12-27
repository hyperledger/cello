#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import viewsets, status
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from api.routes.network.serializers import NetworkQuery, NetworkListResponse
from api.utils.common import with_common_response

LOG = logging.getLogger(__name__)


class NodeViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        query_serializer=NetworkQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NetworkListResponse})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Hosts

        Filter hosts with query parameters.
        """
        return Response(data=[], status=status.HTTP_200_OK)
