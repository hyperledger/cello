from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication

from drf_yasg.utils import swagger_auto_schema

from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator

from api.config import CELLO_HOME, DOCKER_NETWORK_URL
from api.common.serializers import PageQuerySerializer
from api.utils.common import with_common_response
from api.auth import TokenAuth
from api.lib.configtxgen import ConfigTX, ConfigTxGen
from api.lib.peer.channel import Channel as PeerChannel
from api.lib.configtxlator.configtxlator import ConfigTxLator
from api.exceptions import (
    ResourceNotFound,
)
from api.models import (
    Channel,
    Node,
    Port
)
from api.routes.channel.serializers import (
    ChannelCreateBody,
    ChannelIDSerializer,
    ChannelListResponse,
    ChannelResponseSerializer,
    ChannelUpdateSerializer
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
                response = ChannelListResponse(
                    data={"data": channels_list, "total": channels.count()}
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

        serializer = ChannelCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            peers = serializer.validated_data.get("peers")
            orderers = serializer.validated_data.get("orderers")

            try:
                org = request.user.organization
                ConfigTX(org.network.name).createChannel(name, [org.name])
                tx_gen = ConfigTxGen(org.network.name)
                tx_gen.channeltx(name, name)
                tx_path = "{}/{}/{}".format(tx_gen.filepath,
                                            tx_gen.network, name)
                channel = Channel(
                    name=name,
                    network=org.network
                )
                channel.save()
                channel.organizations.add(org)

                ordering_node = Node.objects.get(id=orderers[0])
                org_name = org.name
                org_domain = org_name.split(".", 1)[1]
                msp_id = org_name.split(".")[0].capitalize()
                # Path to ordering service tls certificate.
                dir_certificate = "{}/{}/crypto-config/ordererOrganizations/{}/orderers".format(
                    CELLO_HOME, org_name, org_domain)
                # Path to peer node.
                dir_node = "{}/{}/crypto-config/peerOrganizations".format(
                    CELLO_HOME, org_name)

                # Get the first peer node.
                peer_node = Node.objects.get(id=peers[0])
                peer_port = Port.object.filter(
                    node=peer_node).filter(internal=7051)
                # Initialize environment variables for peer channel CLI.
                peer_cli_envs = {
                    "CORE_PEER_LOCALMSPID": msp_id,
                    "CORE_PEER_TLS_ROOTCERT_FILE": "{}/{}/peers/{}/tls/ca.crt".format(
                        dir_node, org_name, peer_node.name + "." + org_name),
                    "CORE_PEER_ADDRESS": "{}:{}".format(
                        DOCKER_NETWORK_URL, str(peer_port.external)),
                    "CORE_PEER_MSPCONFIGPATH": "{}/{}/users/Admin@{}/msp".format(
                        dir_node, org_name, org_name),
                    "FABRIC_CFG_PATH": "{}/{}/peers/{}".format(dir_node, org_name, peer_node.name + "." + org_name)
                }

                rootcert = "{}/msp/tlscacerts/tlsca.{}-cert.pem".format(
                    dir_certificate, org_domain)
                create_channel(peer_cli_envs, ordering_node,
                               name, tx_path, rootcert, org_name)
                join_peers(peers, peer_cli_envs, dir_node, org)
                # Set the anchor peer
                # TODO: Use configtxgen to set up the anchor peer.
                """
               peer_channel_cli.fetch(
                   option="config", channel=name, orderer_url=ordering_node.urls)
               tx_lator = ConfigTxLator(filepath=CELLO_HOME)
               tx_lator.proto_decode(
                   input="config_block.pb", type="common.Block", output="config_block.json")
               with open(CELLO_HOME + "/config_block.json", "r") as config_file:
                   config = json.load(config_file)
                   config = config["data"]["data"][0]["payload"]["data"]["config"]
                   channel_config = config["channel_group"]["groups"]["Application"]["groups"][msp_id]
                   channel_config.update({
                       {"AnchorPeers": {"mod_policy": "Admins", "value": {"anchor_peers": [
                           {"host": peer_nodes.first().name, "port": 7051}]}, "version": "0"}}
                   })
               with open(CELLO_HOME + '/modified_config.json', 'w') as modified_config:
                   json.dump(channel_config, modified_config)
 
               tx_lator.proto_encode(input="config.json",
                                     type="common.Config", output="config.pb")
               tx_lator.proto_encode(
                   input="modified_config.json", type="common.Config", output="modified_config.pb")
               tx_lator.compute_update(
                   original="config.pb", updated="modified_config.pb", output="config_update.pb", channel_id=name)
               tx_lator.proto_decode(
                   input="config_update.pb", type="common.ConfigUpdate", output="config_update.json")
               with open(CELLO_HOME + "/config_update_in_envelope.json", "w") as config_update_in_envelope:
                   data = {
                       "payload": {
                           "header": {
                               "channel_header": {
                                   "channel_id": name,
                                   "type": 2}},
                           "data": {
                               "config_update": '$(cat config_update.json)'}}}
                   json.dump(data, config_update_in_envelope)
               tx_lator.proto_encode(
                   input="config_update_in_envelope.json", type="common.Envelope ", output="config_update_in_envelope.pb")
               peer_channel_cli.update(
                   channel=name, channel_tx=CELLO_HOME + "/config_update_in_envelope.pb", orderer_url=ordering_node.urls)
               """

                response = ChannelIDSerializer(data=channel.__dict__)
                if response.is_valid(raise_exception=True):
                    return Response(
                        response.validated_data, status=status.HTTP_201_CREATED
                    )
            except ObjectDoesNotExist:
                pass

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
            return Response(response.data, status=status.HTTP_200_OK)

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
                join_peers(peers, peer_cli_envs, dir_node, org)
                return Response(status=status.HTTP_202_ACCEPTED)
            except ObjectDoesNotExist:
                raise ResourceNotFound


def create_channel(peer_cli_envs, orderer, name, tx_path, rootcert, org_name):
    """
    Create an application channel.

    :param peer_cli_envs: peer CLI environment variables.
    :param orderer: Orderer node object.
    :param name: channel name.
    :param tx_path: a path to the transaction.
    :param rootcert: a path to orderer cert.
    :param org_name: a organization name. 
    :return: none

    """
    peer_channel_cli = PeerChannel("v2.2.0", **peer_cli_envs)
    orderer_port = Port.objects.filter(node=orderer).filter(internal=7050)
    # Creating an application channel
    peer_channel_cli.create(
        channel=name,
        orderer_url="{}:{}".format(
            DOCKER_NETWORK_URL, str(orderer_port.external)),
        channel_tx=tx_path,
        orderer_tls_rootcert=rootcert,
        hostname=orderer.name + "." + org_name
    )


def join_peers(peers, peer_cli_envs, dir_node, org):
    """
    Join peer nodes to the channel.

    :param peers: list of peer node IDs.
    :param peer_cli_envs: peer CLI environment variables.
    :dir_node: path to peer node.
    :param org: Organization object.
    :return: none
    """
    # Join the peers to the channel.
    org_name = org.name
    for i in range(0, len(peers)):
        peer_node = Node.objects.get(id=peers[i])
        peer_port = Port.object.filter(
            node=peer_node).filter(internal=7051)
        peer_cli_envs["CORE_PEER_TLS_ROOTCERT_FILE"] = "{}/{}/peers/{}/tls/ca.crt".format(
            dir_node, org_name, peer_node.name + "." + org_name)
        peer_cli_envs["CORE_PEER_ADDRESS"] = "{}:{}".format(
            DOCKER_NETWORK_URL, str(peer_port.external))

        peer_cli_envs["FABRIC_CFG_PATH"] = "{}/{}/peers/{}".format(
            dir_node, org_name, peer_node.name + "." + org_name)
        peer_channel_cli = PeerChannel("v2.2.0", **peer_cli_envs)
        peer_channel_cli.join(
            block_file="{}/{}/genesis.block".format(CELLO_HOME, org.network.name))
