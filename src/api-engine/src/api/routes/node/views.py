#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from django.db.models import Count, F
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema

from api.auth import CustomAuthenticate, IsOperatorAuthenticated
from api.routes.network.serializers import NetworkListResponse
from api.utils.common import with_common_response
from api.routes.node.serializers import (
    NodeOperationSerializer,
    NodeQuery,
    NodeCreateBody,
    NodeIDSerializer,
)
from api.exceptions import CustomError
from api.models import Agent
from api.common.enums import UserRole
from api.models import Node

LOG = logging.getLogger(__name__)


class NodeViewSet(viewsets.ViewSet):
    authentication_classes = (CustomAuthenticate,)
    permission_classes = (IsAuthenticated,)

    def _validate_govern(self, request):
        if request.user.user_model.govern is None:
            raise CustomError(detail="Not joined in any govern.")

    @swagger_auto_schema(
        query_serializer=NodeQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NetworkListResponse})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Nodes

        Filter nodes with query parameters.
        """
        return Response(data=[], status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=NodeCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: NodeIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Node

        Create node
        """
        # serializer = NodeCreateBody(data=request.data)
        # if serializer.is_valid(raise_exception=True):
        #     self._validate_govern(request)
        #     agent_type = serializer.validated_data.get("agent_type")
        #     available_agents = (
        #         Agent.objects.annotate(network_num=Count("network"))
        #         .filter(type=agent_type,
        #                 network_num__lt=F("capacity"))
        #         .order_by("network_num")
        #     )
        #     LOG.info("agents %s", available_agents)
        #     return Response(status=status.HTTP_201_CREATED)
        pass

    @swagger_auto_schema(
        methods=["post"],
        query_serializer=NodeOperationSerializer,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(methods=["post"], detail=True, url_path="operations")
    def operate(self, request, pk=None):
        """
        Operate Node

        Do some operation on node, start/stop/restart
        """
        pass

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        )
    )
    def destroy(self, request, pk=None):
        """
        Delete Node

        Delete node
        """
        pass
