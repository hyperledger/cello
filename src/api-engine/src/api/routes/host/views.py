#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import viewsets, status
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from api.routes.host.serializers import (
    HostQuery,
    HostListResponse,
    HostCreateBody,
    HostIDSerializer,
    HostPatchBody,
    HostUpdateBody,
)
from api.utils.common import with_common_response

LOG = logging.getLogger(__name__)


class HostViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        query_serializer=HostQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: HostListResponse})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Hosts

        Filter hosts with query parameters.
        """
        return Response(data=[], status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=HostCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: HostIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Host

        Create new host
        """
        pass

    @swagger_auto_schema(
        request_body=HostUpdateBody,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    def update(self, request, pk=None):
        """
        Update Host

        Update special host with id.
        """
        pass

    @swagger_auto_schema(
        request_body=HostPatchBody,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    def partial_update(self, request, pk=None):
        """
        Partial Update Host

        Partial update special host with id.
        """
        pass

    @swagger_auto_schema(
        responses=with_common_response(
            {
                status.HTTP_204_NO_CONTENT: "No Content",
                status.HTTP_404_NOT_FOUND: "Not Found",
            }
        )
    )
    def destroy(self, request, pk=None):
        """
        Delete Host

        Delete host
        """
        pass
