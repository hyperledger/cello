#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from api.routes.network.serializers import (
    NetworkQuery,
    NetworkListResponse,
    NetworkOperationBody,
    ChannelBody,
    ChannelID,
    ChannelCreateBody,
    NetworkMemberResponse,
    NetworkCreateBody,
    NetworkIDSerializer,
)
from api.utils.common import with_common_response

LOG = logging.getLogger(__name__)


class NetworkViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        query_serializer=NetworkQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NetworkListResponse})
        ),
    )
    def list(self, request):
        """
        List Networks

        Filter networks with query parameters.
        """
        return Response(data=[], status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=NetworkCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: NetworkIDSerializer}
        ),
    )
    def create(self, request):
        """
        New Network

        Create new network through internal nodes,
        or import exists network outside
        """
        pass

    @swagger_auto_schema(responses=with_common_response())
    def retrieve(self, request, pk=None):
        """
        Get Network

        Get network information
        """
        pass

    @swagger_auto_schema(
        methods=["get"],
        responses=with_common_response(
            {status.HTTP_200_OK: NetworkMemberResponse}
        ),
    )
    @swagger_auto_schema(
        methods=["post"],
        responses=with_common_response(
            {status.HTTP_200_OK: NetworkMemberResponse}
        ),
    )
    @action(methods=["get", "post"], detail=True, url_path="peers")
    def peers(self, request, pk=None):
        """
        get:
        Get Peers

        Get peers of network.
        post:
        Add New Peer

        Add peer into network
        """
        pass

    @swagger_auto_schema(
        methods=["delete"],
        responses=with_common_response(
            {status.HTTP_200_OK: NetworkMemberResponse}
        ),
    )
    @action(methods=["delete"], detail=True, url_path="peers/<str:peer_id>")
    def delete_peer(self, request, pk=None, peer_id=None):
        """
        delete:
        Delete Peer

        Delete peer in network
        """
        pass
