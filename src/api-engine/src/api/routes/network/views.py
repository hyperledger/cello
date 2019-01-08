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
        responses=with_common_response({status.HTTP_201_CREATED: "Created"})
    )
    def create(self, request):
        """
        New Network

        Create new network through internal nodes,
        or import exists network outside
        """
        pass

    @swagger_auto_schema(
        methods=["post"],
        request_body=NetworkOperationBody,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(methods=["post"], detail=True, url_path="operations")
    def operate(self, request, pk=None):
        """
        Operate Network

        Operate on network
        """
        pass

    @swagger_auto_schema(
        methods=["post"],
        request_body=ChannelCreateBody,
        responses=with_common_response({status.HTTP_201_CREATED: ChannelID}),
    )
    @action(
        methods=["post"],
        detail=True,
        url_path="channels",
        url_name="create_channel",
    )
    def create_channel(self, request, pk=None):
        """
        Create Channel

        Create new channel in network
        """
        pass

    @swagger_auto_schema(
        methods=["put"],
        request_body=ChannelBody,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(
        methods=["put"],
        detail=True,
        url_path="channels/<str:channel_id>",
        url_name="update_channel",
    )
    def update_channel(self, request, pk=None, channel_id=None):
        """
        Update Channel

        Update channel in network
        """
        pass

    @swagger_auto_schema(methods=["get"], responses=with_common_response())
    @action(methods=["get"], detail=True, url_path="members")
    def members(self, request, pk=None):
        """
        Get Consortium Members

        Get consortium members of network.
        """
        pass

    @swagger_auto_schema(
        method="get",
        operation_id="Get Channel Members",
        operation_description="Get members of channel",
        responses=with_common_response(),
    )
    @swagger_auto_schema(
        method="post",
        operation_id="Join Node Into Channel",
        operation_description="Join peer node into channel",
        responses=with_common_response(),
    )
    @swagger_auto_schema(
        method="delete",
        operation_id="Remove Node From Channel",
        operation_description="Remove peer from channel",
        responses=with_common_response(),
    )
    @action(
        methods=["get", "post", "delete"],
        detail=True,
        url_path="channels/<str:channel_id>/members",
    )
    def channel_members(self, request, pk=None, channel_id=None):
        pass
