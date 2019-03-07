#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.auth import (
    CustomAuthenticate,
    IsOperatorAuthenticated,
    IsAdminAuthenticated,
)
from api.common.enums import HostType
from api.exceptions import (
    ResourceNotFound,
    ResourceExists,
    CustomError,
    NoResource,
    ResourceInUse,
)
from api.models import Agent, KubernetesConfig
from api.routes.agent.serializers import (
    AgentQuery,
    AgentListResponse,
    AgentCreateBody,
    AgentIDSerializer,
    AgentPatchBody,
    AgentUpdateBody,
    AgentInfoSerializer,
    AgentApplySerializer,
)
from api.utils.common import with_common_response, any_of

LOG = logging.getLogger(__name__)


class AgentViewSet(viewsets.ViewSet):
    authentication_classes = (CustomAuthenticate,)

    def get_permissions(self):
        if self.action in ["apply", "list", "release", "retrieve"]:
            permission_classes = (
                IsAuthenticated,
                any_of(IsAdminAuthenticated, IsOperatorAuthenticated),
            )
        else:
            permission_classes = (IsAuthenticated, IsOperatorAuthenticated)

        return [permission() for permission in permission_classes]

    @swagger_auto_schema(
        query_serializer=AgentQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: AgentListResponse})
        ),
    )
    def list(self, request):
        """
        List Agents

        Filter agents with query parameters.
        """
        serializer = AgentQuery(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")
            agent_status = serializer.validated_data.get("status")
            name = serializer.validated_data.get("name")
            agent_type = serializer.validated_data.get("type")
            organization = serializer.validated_data.get("organization")

            query_filters = {}
            if organization:
                if not request.user.is_operator:
                    raise PermissionDenied()
                query_filters.update({"organization": organization})
            else:
                org_name = (
                    request.user.user_model.organization.name
                    if request.user.user_model.organization
                    else ""
                )
                if request.user.is_administrator:
                    query_filters.update({"organization__name": org_name})
            if name:
                query_filters.update({"name__icontains": name})
            if agent_status:
                query_filters.update({"status": agent_status})
            if agent_type:
                query_filters.update({"type": agent_type})

            agents = Agent.objects.filter(**query_filters)
            p = Paginator(agents, per_page)
            agents = p.page(page)
            agents = [agent.__dict__ for agent in agents]

            response = AgentListResponse(
                data={"data": agents, "total": p.count}
            )
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @swagger_auto_schema(
        request_body=AgentCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: AgentIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Agent

        Create new agent
        """
        serializer = AgentCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            worker_api = serializer.validated_data.get("worker_api")
            capacity = serializer.validated_data.get("capacity")
            node_capacity = serializer.validated_data.get("node_capacity")
            log_level = serializer.validated_data.get("log_level")
            agent_type = serializer.validated_data.get("type")
            schedulable = serializer.validated_data.get("schedulable")
            parameters = serializer.validated_data.get("parameters")
            k8s_config = serializer.validated_data.get("k8s_config")

            body = {
                "worker_api": worker_api,
                "capacity": capacity,
                "node_capacity": node_capacity,
                "type": agent_type,
            }
            if worker_api:
                agent_count = Agent.objects.filter(
                    worker_api=worker_api,
                    govern=request.user.user_model.govern,
                ).count()
                if agent_count > 0:
                    raise ResourceExists(
                        detail="Work api %s already exists" % worker_api
                    )
            if name:
                agent_count = Agent.objects.filter(
                    name=name, govern=request.user.user_model.govern
                ).count()
                if agent_count > 0:
                    raise ResourceExists(
                        detail="Name %s already exists" % name
                    )
                body.update({"name": name})
            if schedulable is not None:
                body.update({"schedulable": schedulable})
            if log_level is not None:
                body.update({"log_level": log_level})
            if parameters is not None:
                body.update({"parameters": parameters})

            agent = Agent(**body)
            agent.save()

            if agent_type == HostType.Kubernetes.name.lower():
                kubernetes_config = KubernetesConfig(
                    **dict(k8s_config), agent=agent
                )
                kubernetes_config.save()

            response = AgentIDSerializer(data=agent.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_201_CREATED
                )

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_200_OK: AgentInfoSerializer}
        )
    )
    def retrieve(self, request, pk=None):
        """
        Retrieve agent

        Retrieve agent
        """
        try:
            if request.user.is_operator:
                agent = Agent.objects.get(id=pk)
            else:
                agent = Agent.objects.get(
                    id=pk, organization=request.user.user_model.organization
                )
            k8s_config = None
            if agent.type == HostType.Kubernetes.name.lower():
                k8s_config = KubernetesConfig.objects.get(agent=agent)
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            data = agent.__dict__
            if k8s_config:
                data.update({"k8s_config": k8s_config.__dict__})
            response = AgentInfoSerializer(data=data)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @swagger_auto_schema(
        request_body=AgentUpdateBody,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    def update(self, request, pk=None):
        """
        Update Agent

        Update special agent with id.
        """
        pass

    @swagger_auto_schema(
        request_body=AgentPatchBody,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    def partial_update(self, request, pk=None):
        """
        Partial Update Agent

        Partial update special agent with id.
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
        Delete Agent

        Delete agent
        """
        try:
            agent = Agent.objects.get(id=pk)
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            if agent.organization is not None:
                raise ResourceInUse
            agent.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        method="post",
        request_body=AgentApplySerializer,
        responses=with_common_response(
            {status.HTTP_200_OK: AgentIDSerializer}
        ),
    )
    @action(methods=["post"], detail=False, url_path="organization")
    def apply(self, request):
        """
        Apply Agent

        Apply Agent
        """
        serializer = AgentApplySerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            agent_type = serializer.validated_data.get("type")
            capacity = serializer.validated_data.get("capacity")

            if request.user.user_model.organization is None:
                raise CustomError(detail="Need join in organization")
            agent_count = Agent.objects.filter(
                organization=request.user.user_model.organization
            ).count()
            if agent_count > 0:
                raise CustomError(detail="Already applied agent.")

            agents = Agent.objects.filter(
                organization__isnull=True,
                type=agent_type,
                capacity__gte=capacity,
                schedulable=True,
            ).order_by("capacity")
            if len(agents) == 0:
                raise NoResource

            agent = agents[0]
            agent.organization = request.user.user_model.organization
            agent.save()

            response = AgentIDSerializer(data=agent.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @swagger_auto_schema(
        method="delete",
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        ),
    )
    @action(methods=["delete"], detail=True, url_path="organization")
    def release(self, request, pk=None):
        """
        Release Agent

        Release Agent
        """
        try:
            if request.user.is_operator:
                agent = Agent.objects.get(id=pk)
            else:
                if request.user.user_model.organization is None:
                    raise CustomError("Need join in organization")
                agent = Agent.objects.get(
                    id=pk, organization=request.user.user_model.organization
                )
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            agent.organization = None
            agent.save()

            return Response(status=status.HTTP_204_NO_CONTENT)
