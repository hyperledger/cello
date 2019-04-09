#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db.models import Count, F
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication

from api.common.enums import NodeStatus
from api.exceptions import CustomError, NoResource
from api.exceptions import ResourceNotFound
from api.models import Agent, Node
from api.routes.node.serializers import (
    NodeOperationSerializer,
    NodeQuery,
    NodeCreateBody,
    NodeIDSerializer,
    NodeListSerializer,
)
from api.tasks import create_node, delete_node
from api.utils.common import with_common_response

LOG = logging.getLogger(__name__)


class NodeViewSet(viewsets.ViewSet):
    authentication_classes = (JSONWebTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    @staticmethod
    def _validate_organization(request):
        if request.user.organization is None:
            raise CustomError(detail="Need join in organization.")

    @swagger_auto_schema(
        query_serializer=NodeQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NodeListSerializer})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Nodes

        Filter nodes with query parameters.
        """
        serializer = NodeQuery(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")
            node_type = serializer.validated_data.get("type")
            name = serializer.validated_data.get("name")
            network_type = serializer.validated_data.get("network_type")
            network_version = serializer.validated_data.get("network_version")
            agent_id = serializer.validated_data.get("agent_id")

            if agent_id is not None and not request.user.is_operator:
                raise PermissionDenied
            query_filter = {}

            if node_type:
                query_filter.update({"type": node_type})
            if name:
                query_filter.update({"name__icontains": name})
            if network_type:
                query_filter.update({"network_type": network_type})
            if network_version:
                query_filter.update({"network_version": network_version})
            if request.user.is_administrator:
                query_filter.update(
                    {"organization": request.user.organization}
                )
            elif request.user.is_common_user:
                query_filter.update({"user": request.user})
            if agent_id:
                query_filter.update({"agent__id": agent_id})
            nodes = Node.objects.filter(**query_filter)
            p = Paginator(nodes, per_page)
            nodes = p.page(page)
            nodes = [node.__dict__ for node in nodes]

            response = NodeListSerializer(
                data={"total": p.count, "data": nodes}
            )
            if response.is_valid(raise_exception=True):
                return Response(
                    data=response.validated_data, status=status.HTTP_200_OK
                )

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
        serializer = NodeCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            self._validate_organization(request)
            agent_type = serializer.validated_data.get("agent_type")
            network_type = serializer.validated_data.get("network_type")
            network_version = serializer.validated_data.get("network_version")
            agent = serializer.validated_data.get("agent")
            node_type = serializer.validated_data.get("type")
            if agent is None:
                available_agents = (
                    Agent.objects.annotate(network_num=Count("node__network"))
                    .annotate(node_num=Count("node"))
                    .filter(
                        schedulable=True,
                        type=agent_type,
                        network_num__lt=F("capacity"),
                        node_num__lt=F("node_capacity"),
                        organization=request.user.organization,
                    )
                    .order_by("node_num")
                )
                if len(available_agents) > 0:
                    agent = available_agents[0]
                else:
                    raise NoResource
            else:
                if not request.user.is_operator:
                    raise PermissionDenied
                node_count = Node.objects.filter(agent=agent).count()
                if node_count >= agent.node_capacity or not agent.schedulable:
                    raise NoResource
            node = Node(
                network_type=network_type,
                agent=agent,
                network_version=network_version,
                user=request.user,
                organization=request.user.organization,
                type=node_type,
            )
            node.save()
            create_node.delay(str(node.id))
            response = NodeIDSerializer(data={"id": str(node.id)})
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_201_CREATED
                )

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
        try:
            if request.user.is_superuser:
                node = Node.objects.get(id=pk)
            else:
                node = Node.objects.get(
                    id=pk, organization=request.user.organization
                )
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            if node.status != NodeStatus.Deleting.name.lower():
                if node.status != NodeStatus.Error.name.lower():
                    node.status = NodeStatus.Deleting.name.lower()
                    node.save()

                    delete_node.delay(str(node.id))
                else:
                    node.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)
