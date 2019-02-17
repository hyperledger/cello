#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from django.core.exceptions import ObjectDoesNotExist

from api.auth import CustomAuthenticate, IsAdminAuthenticated
from api.utils.common import with_common_response
from api.exceptions import ResourceExists, ResourceNotFound
from api.routes.govern.serializers import (
    GovernQuery,
    GovernCreateBody,
    GovernList,
    GovernResponse,
    GovernIDSerializer,
)
from api.models import Govern

LOG = logging.getLogger(__name__)


class GovernViewSet(viewsets.ViewSet):
    authentication_classes = (CustomAuthenticate,)
    permission_classes = (IsAuthenticated, IsAdminAuthenticated)

    @swagger_auto_schema(
        query_serializer=GovernQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: GovernList})
        ),
    )
    def list(self, request):
        """
        List Governs

        List governs through query parameter
        """
        serializer = GovernQuery(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page", 1)
            per_page = serializer.validated_data.get("per_page", 10)
            name = serializer.validated_data.get("name")
            start = per_page * (page - 1)
            end = start + per_page
            parameters = {}
            if name:
                parameters.update({"name__icontains": name})
            governs = Govern.objects.filter(**parameters)[start:end]
            governs = [
                {
                    "id": str(govern.id),
                    "name": govern.name,
                    "created_at": govern.created_at,
                }
                for govern in governs
            ]
            govern_count = Govern.objects.filter(**parameters).count()
            response = GovernList(
                data={"total": govern_count, "data": governs}
            )
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @swagger_auto_schema(
        request_body=GovernCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: GovernIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Company

        Create new company
        """
        serializer = GovernCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            try:
                Govern.objects.get(name=name)
            except ObjectDoesNotExist:
                pass
            else:
                raise ResourceExists
            govern = Govern(name=name)
            govern.save()

            response = GovernIDSerializer(data=govern.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_201_CREATED
                )

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        )
    )
    def destroy(self, request, pk=None):
        """
        Delete Govern

        Delete Govern
        """
        try:
            govern = Govern.objects.get(id=pk)
            govern.delete()
        except ObjectDoesNotExist:
            raise ResourceNotFound

        return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        responses=with_common_response({status.HTTP_200_OK: GovernResponse})
    )
    def retrieve(self, request, pk=None):
        """
        Retrieve Govern

        Retrieve Govern
        """
        try:
            govern = Govern.objects.get(id=pk)
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            response = GovernResponse(data=govern.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @swagger_auto_schema(method="get", responses=with_common_response())
    @swagger_auto_schema(method="post", responses=with_common_response())
    @swagger_auto_schema(method="delete", responses=with_common_response())
    @action(methods=["get", "post", "delete"], detail=True, url_path="users")
    def users(self, request, pk=None):
        """
        get:
        List users

        List users in company

        post:
        Add User

        Add user into company
        delete:
        Delete User

        Delete user from company
        """
        pass

    @swagger_auto_schema(method="post", responses=with_common_response())
    @action(methods=["post"], detail=True, url_path="certificates")
    def request_certificate(self, request, pk=None):
        """
        post:
        Request Certificate

        Request certificate
        """
        pass
