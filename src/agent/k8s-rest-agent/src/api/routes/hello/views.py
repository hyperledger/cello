import logging
import os

from rest_framework import viewsets, status
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import action
from rest_framework.response import Response

from api.utils.mixins import PermissionsPerMethodMixin

LOG = logging.getLogger(__name__)
APP_VERSION = os.getenv("APP_VERSION", "v1")


class HelloViewSet(PermissionsPerMethodMixin, viewsets.ViewSet):

    @swagger_auto_schema(
        operation_summary="Hello world", operation_description="Hello world"
    )
    def list(self, request):
        return Response(
            {"hello": "world %s" % APP_VERSION}, status=status.HTTP_200_OK
        )

    @swagger_auto_schema(operation_summary="hello world need auth")
    @action(
        methods=["get"],
        url_path="need-auth",
        url_name="need-auth",
        detail=False,
    )
    # @permission_classes((IsAuthenticated,))
    def need_auth(self, request):
        LOG.info("request user %s", request.user)
        return Response(
            {"hello": "auth world %s" % APP_VERSION}, status=status.HTTP_200_OK
        )
