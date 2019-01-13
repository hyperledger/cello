#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from api.routes.network.serializers import NetworkListResponse
from api.utils.common import with_common_response
from api.routes.company.serializers import (
    CompanyQuery,
    CompanyCreateBody,
    CompanyIDSerializer,
)

LOG = logging.getLogger(__name__)


class CompanyViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        query_serializer=CompanyQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NetworkListResponse})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Companies

        List company through query parameter
        """
        return Response(data=[], status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=CompanyCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: CompanyIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Company

        Create new company
        """
        pass

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        )
    )
    def destroy(self, request, pk=None):
        """
        Delete Company

        Delete company
        """
        pass

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
