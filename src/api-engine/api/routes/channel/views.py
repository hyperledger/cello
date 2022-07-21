#
# SPDX-License-Identifier: Apache-2.0
#
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication

from drf_yasg.utils import swagger_auto_schema

from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator

from api.config import CELLO_HOME
from api.common.serializers import PageQuerySerializer
from api.utils.common import with_common_response
from api.auth import TokenAuth
from api.lib.configtxgen import ConfigTX, ConfigTxGen
from api.lib.peer.channel import Channel as PeerChannel
from api.exceptions import (
    ResourceNotFound,
)
from api.models import (
    Channel,
    Node,
)
from api.routes.channel.serializers import (
    ChannelCreateBody,
    ChannelIDSerializer,
    ChannelListResponse,
    ChannelResponseSerializer,
    ChannelUpdateSerializer
)
from api.common import ok, err


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
                org = request.user.organization
                channels = Channel.objects.filter(
                    organizations=org).order_by("create_ts")
                p = Paginator(channels, per_page)
                channels_pages = p.page(page)
                channels_list = [
                    {
                        "id": channel.id,
                        "name": channel.name,
                        "network": channel.network.__dict__,
                        "organizations": [{"id": org.id, "name": org.name} for org in channel.organizations.all()],
                        "create_ts": channel.create_ts,
                    }
                    for channel in channels_pages
                ]
                response = ChannelListResponse({"data": channels_list, "total": channels.count()})
                return Response(data=ok(response.data), status=status.HTTP_200_OK)
            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )

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
            peers = serializer.validated_data.get("peers")
            orderers = serializer.validated_data.get("orderers")

            try:
                org = request.user.organization
                ConfigTX(org.network.name).createChannel(name, [org.name])
                ConfigTxGen(org.network.name).channeltx(profile=name, channelid=name, outputCreateChannelTx="{}.tx".format(name))
                tx_path = "{}/{}/channel-artifacts/{}.tx".format(CELLO_HOME, org.network.name, name)
                block_path = "{}/{}/channel-artifacts/{}.block".format(CELLO_HOME, org.network.name, name)
                ordering_node = Node.objects.get(id=orderers[0])
                peer_node = Node.objects.get(id=peers[0])
                envs = init_env_vars(peer_node, org)
                peer_channel_cli = PeerChannel("v2.2.0", **envs)
                peer_channel_cli.create(
                    channel=name,
                    orderer_url="{}.{}:{}".format(ordering_node.name, org.name.split(".", 1)[1], str(7050)),
                    channel_tx=tx_path,
                    output_block=block_path
                )
                for i in range(len(peers)):
                    peer_node = Node.objects.get(id=peers[i])
                    envs = init_env_vars(peer_node, org)
                    # envs["CORE_PEER_LOCALMSPID"] = '{}MSP'.format(peer_node.name.split(".")[0].capitalize()) #Org1MSP
                    join_peers(envs, block_path)

                channel = Channel(
                    name=name,
                    network=org.network
                )
                channel.save()
                channel.organizations.add(org)
                channel.orderers.add(ordering_node)
                response = ChannelIDSerializer(data=channel.__dict__)
                if response.is_valid(raise_exception=True):
                    return Response(
                        ok(response.validated_data), status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_200_OK: ChannelResponseSerializer}),
    )
    def retrieve(self, request, pk=None):
        """
        Retrieve channel
        :param request: retrieve parameter
        :param pk: primary key
        :return: none
        :rtype: rest_framework.status
        """
        try:
            channel = Channel.objects.get(id=pk)
            response = ChannelResponseSerializer(instance=channel)
            return Response(ok(response.data), status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            raise ResourceNotFound

    @swagger_auto_schema(
        request_body=ChannelUpdateSerializer,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    def update(self, request, pk=None):
        """
        Update channel
        :param request: update parameters
        :param pk: primary key
        :return: none
        :rtype: rest_framework.status
        """
        serializer = ChannelUpdateSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            peers = serializer.validated_data.get("peers")
            channel = Channel.objects.get(id=pk)
            try:
                org = request.user.organization
                org_name = org.name
                msp_id = org_name.split(".")[0].capitalize()
                dir_node = "{}/{}/crypto-config/peerOrganizations".format(
                    CELLO_HOME, org_name)
                peer_cli_envs = {
                    "CORE_PEER_LOCALMSPID": msp_id,
                    "CORE_PEER_MSPCONFIGPATH": "{}/{}/users/Admin@{}/msp".format(
                        dir_node, org_name, org_name),
                }
                join_peers(peers, peer_cli_envs, dir_node, org, channel.name)
                return Response(status=status.HTTP_202_ACCEPTED)
            except ObjectDoesNotExist:
                raise ResourceNotFound


def init_env_vars(node, org):
    """
    Initialize environment variables for peer channel CLI.
    :param node: Node object
    :param org: Organization object.
    :return env: dict
    """
    org_name = org.name
    org_domain = org_name.split(".", 1)[1]
    dir_certificate = "{}/{}/crypto-config/ordererOrganizations/{}".format(
        CELLO_HOME, org_name, org_domain)
    dir_node = "{}/{}/crypto-config/peerOrganizations".format(
        CELLO_HOME, org_name)

    envs = {
        "CORE_PEER_TLS_ENABLED": "true",
        "CORE_PEER_LOCALMSPID": "{}MSP".format(org_name.capitalize()),  # "Org1.cello.comMSP"
        "CORE_PEER_TLS_ROOTCERT_FILE": "{}/{}/peers/{}/tls/ca.crt".format(dir_node, org_name, node.name + "." + org_name),
        "CORE_PEER_ADDRESS": "{}:{}".format(
            node.name + "." + org_name, str(7051)),
        "CORE_PEER_MSPCONFIGPATH": "{}/{}/users/Admin@{}/msp".format(dir_node, org_name, org_name),
        "FABRIC_CFG_PATH": "{}/{}/peers/{}/".format(dir_node, org_name, node.name + "." + org_name),
        "ORDERER_CA": "{}/msp/tlscacerts/tlsca.{}-cert.pem".format(dir_certificate, org_domain)
    }
    return envs


def join_peers(envs, block_path):
    """
    Join peer nodes to the channel.
    :param envs: environments variables for peer CLI.
    :param block_path: Path to file containing genesis block
    """
    # Join the peers to the channel.
    peer_channel_cli = PeerChannel("v2.2.0", **envs)
    peer_channel_cli.join(
        block_file=block_path
    )
