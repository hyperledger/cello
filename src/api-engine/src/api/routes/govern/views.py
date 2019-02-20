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
from django.core.paginator import Paginator

from api.auth import CustomAuthenticate, IsAdminAuthenticated
from api.utils.common import with_common_response
from api.exceptions import ResourceExists, ResourceNotFound, ResourceInUse
from api.utils.keycloak_client import KeyCloakClient
from api.routes.govern.serializers import (
    GovernQuery,
    GovernCreateBody,
    GovernList,
    GovernResponse,
    GovernIDSerializer,
)
from api.routes.user.serializers import UserIDSerializer
from api.models import Govern, UserModel
from api.routes.user.serializers import UserListSerializer, UserQuerySerializer

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
            parameters = {}
            if name:
                parameters.update({"name__icontains": name})
            governs = Govern.objects.filter(**parameters)
            p = Paginator(governs, per_page)
            governs = p.page(page)
            governs = [
                {
                    "id": str(govern.id),
                    "name": govern.name,
                    "created_at": govern.created_at,
                }
                for govern in governs
            ]
            response = GovernList(data={"total": p.count, "data": governs})
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
            user_count = UserModel.objects.filter(govern=govern).count()
            if user_count > 0:
                raise ResourceInUse
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

    def _list_users(self, request, pk=None):
        serializer = UserQuerySerializer(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            try:
                govern = Govern.objects.get(id=pk)
            except ObjectDoesNotExist:
                raise ResourceNotFound
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")
            name = serializer.validated_data.get("name")
            parameter = {"govern": govern}
            if name:
                parameter.update({"name__icontains": name})
            users = UserModel.objects.filter(**parameter)
            p = Paginator(users, per_page)
            users = p.page(page)
            users = [
                {"id": str(user.id), "name": user.name, "role": user.role}
                for user in users
            ]
            response = UserListSerializer(
                data={"total": p.count, "data": users}
            )
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    def _add_user(self, request, pk=None):
        serializer = UserIDSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user_id = serializer.validated_data.get("id")
            try:
                govern = Govern.objects.get(id=pk)
                user = UserModel.objects.get(id=user_id)
                if user.govern:
                    raise ResourceInUse
            except ObjectDoesNotExist:
                raise ResourceNotFound
            else:
                keycloak_client = KeyCloakClient()
                user_info = keycloak_client.get_user(user.name)
                user_attr = user_info.get("attributes", {})
                user_attr.update({"govern": pk})
                keycloak_client.update_user(
                    user_id, body={"attributes": user_attr}
                )
                user.govern = govern
                user.save()

                return Response(status=status.HTTP_202_ACCEPTED)

    @swagger_auto_schema(
        method="get",
        query_serializer=UserQuerySerializer,
        responses=with_common_response(
            {status.HTTP_200_OK: UserListSerializer}
        ),
    )
    @swagger_auto_schema(
        method="post",
        request_body=UserIDSerializer,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(methods=["get", "post"], detail=True, url_path="users")
    def manage_users(self, request, pk=None):
        """
        get:
        List users

        List users in govern

        post:
        Add User

        Add user into govern
        """
        if request.method == "GET":
            return self._list_users(request, pk)
        elif request.method == "POST":
            return self._add_user(request, pk)

    @swagger_auto_schema(
        method="delete",
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        ),
    )
    @action(
        methods=["delete"], detail=True, url_path="users/(?P<user_id>[^/.]+)"
    )
    def remove_user_from_govern(self, request, pk=None, user_id=None):
        """
        Remove user from govern

        Remove user from govern
        """
        try:
            user = UserModel.objects.get(id=user_id, govern__id=pk)
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            keycloak_client = KeyCloakClient()
            user_info = keycloak_client.get_user(user.name)
            user_attr = user_info.get("attributes", {})
            if "govern" in user_attr:
                del user_attr["govern"]

            keycloak_client.update_user(
                user_id, body={"attributes": user_attr}
            )

            user.govern = None
            user.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(method="post", responses=with_common_response())
    @action(methods=["post"], detail=True, url_path="certificates")
    def request_certificate(self, request, pk=None):
        """
        post:
        Request Certificate

        Request certificate
        """
        pass
