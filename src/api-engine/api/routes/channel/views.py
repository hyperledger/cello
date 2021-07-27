from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
from drf_yasg.utils import swagger_auto_schema
from django.core.exceptions import ObjectDoesNotExist
from api.common.serializers import PageQuerySerializer
from django.core.paginator import Paginator

from api.utils.common import with_common_response
from api.auth import TokenAuth

from api.models import (
    Organization,
    Channel
)
from api.routes.channel.serializers import (
    ChannelCreateBody,
    ChannelIDSerializer,
    ChannelListResponse
)


class ChannelViewSet(viewsets.ViewSet):
    """Class represents Channel related operations."""
    authentication_classes = (JSONWebTokenAuthentication, TokenAuth)

    @swagger_auto_schema(
        query_serializer=PageQuerySerializer,
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChannelListResponse}
        ),
    )
    def list(self, request):
        """
        List Channels

        :param request: org_id
        :return: channel list
        :rtype: list
        """
        serializer = PageQuerySerializer(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")

            try:
                org_id = request.user.organization
                org = Organization.objects.get(pk=org_id)
                channels = Channel.objects.filter(network=org.network)
                p = Paginator(channels, per_page)
                channels = p.page(page)
                response = ChannelListResponse(
                    data={"data": channels, "total": channels.count}
                )
                if response.is_valid(raise_exception=True):
                    return Response(
                        response.validated_data, status=status.HTTP_200_OK
                    )
            except ObjectDoesNotExist:
                pass

    @swagger_auto_schema(
        request_body=ChannelCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChannelIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Channel

        :param request: create parameter
        :return: Channel ID
        :rtype: uuid
        """
        org_id = request.user.organization
        serializer = ChannelCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            peers = serializer.validated_data.get("peers")
            orderers = serializer.validated_data.get("orderers")

            try:
                org = Organization.objects.get(pk=org_id)
                channel = Channel(
                    name=name,
                    network=org.network
                )
                org.chanel = channel
                org.save()
                # TODO: Interact with the Fabric CLI.
                response = ChannelIDSerializer(data=channel.__dict__)
                if response.is_valid(raise_exception=True):
                    return Response(
                        response.validated_data, status=status.HTTP_201_CREATED
                    )
            except ObjectDoesNotExist:
                pass
