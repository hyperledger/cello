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
                ConfigTxGen(org.network.name).channeltx(name, name)
                tx_path = "{}/{}/channel-artifacts/channel.tx".format(CELLO_HOME, org.network.name)
                channel = Channel(
                    name=name,
                    network=org.network
                )
                channel.save()
                channel.organizations.add(org)

                ordering_node = Node.objects.get(id=orderers[0])
                org_name = org.name
                org_domain = org_name.split(".", 1)[1]
                msp_id = org_name.capitalize() + "MSP"
                # Path to ordering service tls certificate.
                dir_certificate = "{}/{}/crypto-config/ordererOrganizations/{}".format(
                    CELLO_HOME, org_name, org_domain)
                # Path to peer node.
                dir_node = "{}/{}/crypto-config/peerOrganizations".format(
                    CELLO_HOME, org_name)

                # Get the first peer node.
                peer_node = Node.objects.get(id=peers[0])
                # Initialize environment variables for peer channel CLI.
                peer_cli_envs = {
                    "CORE_PEER_TLS_ENABLED": "true",
                    "CORE_PEER_LOCALMSPID": msp_id, # "Org1.cello.comMSP"
                    "CORE_PEER_TLS_ROOTCERT_FILE": "{}/{}/peers/{}/tls/ca.crt".format(dir_node, org_name, peer_node.name + "." + org_name),
                    # "/opt/cello/org1.cello.com/crypto-config/peerOrganizations/org1.cello.com/peers/peer0.org1.cello.com/tls/ca.crt",
                    "CORE_PEER_ADDRESS": "{}:{}".format(
                        peer_node.name +"." + org_name, str(7051)),
                    # peer0.org1.cello.com
                    "CORE_PEER_MSPCONFIGPATH": "{}/{}/users/Admin@{}/msp".format(dir_node, org_name, org_name),
                    # "/opt/cello/org1.cello.com/crypto-config/peerOrganizations/org1.cello.com/users/Admin@org1.cello.com/msp",
                    "FABRIC_CFG_PATH":"{}/{}/peers/{}/".format(dir_node, org_name, peer_node.name + "." + org_name) 
                    #"/opt/cello/org1.cello.com/crypto-config/peerOrganizations/org1.cello.com/peers/peer0.org1.cello.com/",
                }
                rootcert = "{}/msp/tlscacerts/tlsca.{}-cert.pem".format(
                    dir_certificate, org_domain)
                #rootcert = "/opt/cello/org1.cello.com/crypto-config/ordererOrganizations/cello.com/msp/tlscacerts/tlsca.cello.com-cert.pem"
                #create_channel(peer_cli_envs, ordering_node,name, tx_path, rootcert, org_domain)

                peer_channel_cli = PeerChannel("v2.2.0", **peer_cli_envs)
                # Creating an application channel
                peer_channel_cli.create(
                    channel=name,
                    orderer_url= "{}:{}".format(ordering_node.name + "." + org_domain, str(7050)),
                    channel_tx=tx_path,
                    orderer_tls_rootcert=rootcert,
                )
                join_peers(peers, peer_cli_envs, dir_node, org, name)
                # peer_channel_cli.join(
                #     block_file="{}/{}/channel-artifacts/{}.block".format(CELLO_HOME, org.network.name, name),
                # )
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
                join_peers(peers, peer_cli_envs, dir_node, org, channel.name)
                return Response(status=status.HTTP_202_ACCEPTED)
            except ObjectDoesNotExist:
                raise ResourceNotFound

def join_peers(peers, peer_cli_envs, dir_node, org, name=None):
    """
    Join peer nodes to the channel.

    :param peers: list of peer node IDs.
    :param peer_cli_envs: peer CLI environment variables.
    :dir_node: path to peer node.
    :param org: Organization object.
    :param name: Channle Id
    :return: none
    """
    # Join the peers to the channel.
    org_name = org.name
    for i in range(0, len(peers)):
        peer_node = Node.objects.get(id=peers[i])
        peer_cli_envs["CORE_PEER_TLS_ROOTCERT_FILE"] = "{}/{}/peers/{}/tls/ca.crt".format(
            dir_node, org_name, peer_node.name + "." + org_name)
        peer_cli_envs["CORE_PEER_ADDRESS"] = "{}:{}".format(
            peer_node.name +"." + org_name, str(7051))
        peer_cli_envs["FABRIC_CFG_PATH"] = "{}/{}/peers/{}".format(
            dir_node, org_name, peer_node.name + "." + org_name)
        peer_channel_cli = PeerChannel("v2.2.0", **peer_cli_envs)
        peer_channel_cli.join(
            block_file="{}/{}/channel-artifacts/{}.block".format(CELLO_HOME, org.network.name, name)
        )
