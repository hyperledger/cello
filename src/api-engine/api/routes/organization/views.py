#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import base64

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator
from rest_framework_jwt.authentication import JSONWebTokenAuthentication

from api.auth import IsOperatorAuthenticated
from api.utils.common import with_common_response
from api.exceptions import ResourceExists, ResourceNotFound, ResourceInUse
from api.routes.organization.serializers import (
    OrganizationQuery,
    OrganizationCreateBody,
    OrganizationList,
    OrganizationResponse,
    OrganizationIDSerializer,
)
from api.routes.user.serializers import UserIDSerializer
from api.models import UserProfile, Organization
from api.routes.user.serializers import UserListSerializer, UserQuerySerializer
from api.lib.pki import CryptoGen, CryptoConfig
from api.utils import zip_dir, zip_file
from api.config import CELLO_HOME


LOG = logging.getLogger(__name__)


class OrganizationViewSet(viewsets.ViewSet):
    """Class represents orgnization related operations."""
    #authentication_classes = (JSONWebTokenAuthentication,)
    #permission_classes = (IsAuthenticated, IsOperatorAuthenticated)

    @swagger_auto_schema(
        query_serializer=OrganizationQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: OrganizationList})
        ),
    )
    def list(self, request):
        """
        List Organizations

        :param request: query parameter
        :return: organization list
        :rtype: list
        """
        serializer = OrganizationQuery(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page", 1)
            per_page = serializer.validated_data.get("per_page", 10)
            name = serializer.validated_data.get("name")
            parameters = {}
            if name:
                parameters.update({"name__icontains": name})
            organizations = Organization.objects.filter(**parameters)
            p = Paginator(organizations, per_page)
            organizations = p.page(page)
            organizations = [
                {
                    "id": str(organization.id),
                    "name": organization.name,
                    "created_at": organization.created_at,
                }
                for organization in organizations
            ]
            response = OrganizationList(
                data={"total": p.count, "data": organizations}
            )
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @swagger_auto_schema(
        request_body=OrganizationCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: OrganizationIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Organization

        :param request: create parameter
        :return: organization ID
        :rtype: uuid
        """
        serializer = OrganizationCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            try:
                Organization.objects.get(name=name)
            except ObjectDoesNotExist:
                pass
            else:
                raise ResourceExists

            CryptoConfig(name).create()
            CryptoGen(name).generate()

            msp, tls = self._conversion_msp_tls(name)

            organization = Organization(name=name, msp=msp, tls=tls)
            organization.save()

            response = OrganizationIDSerializer(data=organization.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_201_CREATED
                )

    def _conversion_msp_tls(self, name):
        """
        msp and tls from zip file to byte

        :param name: organization name
        :return: msp, tls
        :rtype: bytes
        """
        try:
            dir_org = "{}/{}/crypto-config/peerOrganizations/{}/" \
                .format(CELLO_HOME, name, name)

            zip_dir("{}msp".format(dir_org), "{}msp.zip".format(dir_org))
            with open("{}msp.zip".format(dir_org), "rb") as f_msp:
                msp = base64.b64encode(f_msp.read())

            zip_dir("{}tlsca".format(dir_org), "{}tls.zip".format(dir_org))
            with open("{}tls.zip".format(dir_org), "rb") as f_tls:
                tls = base64.b64encode(f_tls.read())
        except Exception as e:
            raise e

        return msp, tls

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        )
    )
    def destroy(self, request, pk=None):
        """
        Delete Organization

        :param request: destory parameter
        :param pk: primary key
        :return: none
        :rtype: rest_framework.status
        """
        try:
            organization = Organization.objects.get(id=pk)
            if organization.network:
                raise ResourceInUse

            # user_count = UserProfile.objects.filter(
            #     organization=organization
            # ).count()
            # if user_count > 0:
            #     raise ResourceInUse
            organization.delete()
        except ObjectDoesNotExist:
            raise ResourceNotFound

        return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_200_OK: OrganizationResponse}
        )
    )
    def retrieve(self, request, pk=None):
        """
        Retrieve Organization

        :param request: retrieve parameter
        :param pk: primary key
        :return: organization info
        :rtype: OrganizationResponse
        """
        try:
            organization = Organization.objects.get(id=pk)
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            response = OrganizationResponse(data=organization.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @staticmethod
    def _list_users(request, pk=None):
        serializer = UserQuerySerializer(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            try:
                organization = Organization.objects.get(id=pk)
            except ObjectDoesNotExist:
                raise ResourceNotFound
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")
            name = serializer.validated_data.get("name")
            parameter = {"organization": organization}
            if name:
                parameter.update({"username__icontains": name})
            users = UserProfile.objects.filter(**parameter)
            p = Paginator(users, per_page)
            users = p.page(page)
            users = [
                {
                    "id": str(user.id),
                    "username": user.username,
                    "role": user.role,
                }
                for user in users
            ]
            response = UserListSerializer(
                data={"total": p.count, "data": users}
            )
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )

    @staticmethod
    def _add_user(request, pk=None):
        serializer = UserIDSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user_id = serializer.validated_data.get("id")
            try:
                organization = Organization.objects.get(id=pk)
                user = UserProfile.objects.get(id=user_id)
                if user.organization:
                    raise ResourceInUse
            except ObjectDoesNotExist:
                raise ResourceNotFound
            else:
                user.organization = organization
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

        List users in Organization

        post:
        Add User

        Add user into Organization
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
        Remove user from Organization

        Remove user from Organization
        """
        try:
            user = UserProfile.objects.get(id=user_id, organization__id=pk)
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            user.organization = None
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
