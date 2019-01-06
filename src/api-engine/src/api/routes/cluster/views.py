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
from api.routes.cluster.serializers import (
    ClusterQuery,
    ClusterCreateBody,
    ClusterIDSerializer,
    ClusterOperationSerializer,
)

LOG = logging.getLogger(__name__)


class ClusterViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        query_serializer=ClusterQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NetworkListResponse})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Clusters

        Filter clusters with query parameters.
        """
        return Response(data=[], status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=ClusterCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: ClusterIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Cluster

        Create new cluster
        """
        pass

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        )
    )
    def destroy(self, request, pk=None):
        """
        Delete Cluster

        Delete cluster
        """
        pass

    @swagger_auto_schema(
        methods=["post"],
        query_serializer=ClusterOperationSerializer,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(methods=["post"], detail=True, url_path="operations")
    def operate(self, request, pk=None):
        """
        Operate Cluster

        Operate cluster start/stop/restart
        """
        pass
