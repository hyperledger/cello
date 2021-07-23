from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
from drf_yasg.utils import swagger_auto_schema
from django.core.exceptions import ObjectDoesNotExist

from api.utils.common import with_common_response
from api.auth import TokenAuth

from api.models import (
    Organization,
    Channel
)
from api.routes.channel.serializers import (
    ChannelCreateBody,
    ChannelIDSerializer
)


class ChannelViewSet(viewsets.ViewSet):
    """Class represents Channel related operations."""
    authentication_classes = (JSONWebTokenAuthentication, TokenAuth)

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
        serializer = ChannelCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            org_id = serializer.validated_data.get("organization")
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
                response = ChannelIDSerializer(data=channel.__dict__)
                if response.is_valid(raise_exception=True):
                    return Response(
                        response.validated_data, status=status.HTTP_201_CREATED
                    )
            except ObjectDoesNotExist:
                pass
