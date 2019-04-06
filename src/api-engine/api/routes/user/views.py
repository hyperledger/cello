#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication

from api.auth import IsAdminAuthenticated, IsOperatorAuthenticated
from api.exceptions import ResourceExists, CustomError
from api.models import UserProfile
from api.routes.user.serializers import UserCreateBody, UserIDSerializer
from api.utils.common import any_of
from api.utils.common import with_common_response

LOG = logging.getLogger(__name__)


class UserViewSet(viewsets.ViewSet):
    authentication_classes = (JSONWebTokenAuthentication,)

    def get_permissions(self):
        permission_classes = []

        if self.action not in ["auth"]:
            permission_classes = (
                IsAuthenticated,
                any_of(IsAdminAuthenticated, IsOperatorAuthenticated),
            )

        return [permission() for permission in permission_classes]

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
            username = serializer.validated_data.get("username")
            role = serializer.validated_data.get("role")
            organization = serializer.validated_data.get("organization")
            password = serializer.validated_data.get("password")
            email = serializer.validated_data.get("email")

            user_count = UserProfile.objects.filter(
                Q(username=username) | Q(email=email)
            ).count()
            if user_count > 0:
                raise ResourceExists(
                    detail="User name or email already exists"
                )

            user = UserProfile(
                username=username,
                role=role,
                email=email,
                organization=organization,
            )
            user.set_password(password)
            user.save()
            response = UserIDSerializer(data={"id": user.id})
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
        try:
            UserProfile.objects.get(id=pk).delete()
        except Exception as e:
            raise CustomError(detail=str(e))
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

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
