#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from api.routes.network.serializers import NetworkListResponse
from api.utils.common import with_common_response
from api.routes.company.serializers import (
    NodeOperationSerializer,
    CompanyQuery,
    CompanyCreateBody,
    CompanyIDSerializer,
)
from api.auth import CustomAuthenticate

LOG = logging.getLogger(__name__)


class UserViewSet(viewsets.ViewSet):
    authentication_classes = (CustomAuthenticate,)
    permission_classes = (IsAuthenticated,)

    @swagger_auto_schema(
        query_serializer=CompanyQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NetworkListResponse})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Users

        List user through query parameter
        """
        LOG.info("user %s", request.user.role)
        return Response(data=[], status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=CompanyCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: CompanyIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create User

        Create new user
        """
        pass

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
