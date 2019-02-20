#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from api.utils.common import with_common_response
from api.routes.user.serializers import UserCreateBody, UserIDSerializer
from api.auth import CustomAuthenticate, IsAdminAuthenticated
from api.utils.keycloak_client import KeyCloakClient
from api.exceptions import ResourceExists
from api.models import UserModel

LOG = logging.getLogger(__name__)


class UserViewSet(viewsets.ViewSet):
    authentication_classes = (CustomAuthenticate,)
    permission_classes = (IsAuthenticated, IsAdminAuthenticated)

    @swagger_auto_schema(
        responses=with_common_response(with_common_response())
    )
    def list(self, request, *args, **kwargs):
        """
        List Users

        List user through query parameter
        """
        return Response(data=[], status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=UserCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: UserIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create User

        Create new user
        """
        serializer = UserCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            role = serializer.validated_data.get("role")
            govern = serializer.validated_data.get("govern")
            password = serializer.validated_data.get("password")

            keycloak_client = KeyCloakClient()
            user_exists = keycloak_client.get_user(username=name)
            if user_exists:
                raise ResourceExists

            create_user_body = {
                "username": name,
                "requiredActions": [],
                "enabled": True,
            }

            keycloak_client.create_user(create_user_body)

            user_id = keycloak_client.get_user_id(username=name)
            keycloak_client.reset_user_password(user_id, password)
            user_attr = {"role": role}
            if govern:
                user_attr.update({"govern": str(govern.id)})

            keycloak_client.update_user(
                user_id, body={"attributes": user_attr}
            )

            user, _ = UserModel.objects.get_or_create(
                id=user_id, name=name, role=role, govern=govern
            )
            response = UserIDSerializer(data={"id": user_id})
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
        Delete User

        Delete user
        """
        pass

    @action(
        methods=["get", "post", "put", "delete"],
        detail=True,
        url_path="attributes",
    )
    def attributes(self, request, pk=None):
        """
        get:
        Get User Attributes

        Get attributes of user
        post:
        Create Attributes

        Create attribute for user
        put:
        Update Attribute

        Update attribute of user
        delete:
        Delete Attribute

        Delete attribute of user
        """
        pass

    @swagger_auto_schema(method="post", responses=with_common_response())
    @action(methods=["post"], detail=True, url_path="password")
    def password(self, request, pk=None):
        """
        post:
        Update/Reset Password

        Update/Reset password for user
        """
        pass
