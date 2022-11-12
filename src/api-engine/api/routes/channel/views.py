#
# SPDX-License-Identifier: Apache-2.0
#
from copy import deepcopy
import logging
import json

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
#

from drf_yasg.utils import swagger_auto_schema

from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator

from api.config import CELLO_HOME
from api.common.serializers import PageQuerySerializer
from api.utils.common import with_common_response, parse_block_file, to_dict
from api.lib.configtxgen import ConfigTX, ConfigTxGen
from api.lib.peer.channel import Channel as PeerChannel
from api.lib.configtxlator.configtxlator import ConfigTxLator
from api.exceptions import (
    ResourceNotFound,
)
from api.models import (
    Channel,
    Node,
    Organization,
    Network,
)
from api.routes.channel.serializers import (
    ChannelCreateBody,
    ChannelIDSerializer,
    ChannelListResponse,
    ChannelResponseSerializer,
    ChannelUpdateSerializer
)

from api.common import ok, err
from api.common.enums import (
    NodeStatus,
    FabricNodeType,
)

LOG = logging.getLogger(__name__)

CFG_JSON = "cfg.json"
CFG_PB = "cfg.pb"
DELTA_PB = "delta.pb"
DELTA_JSON = "delta.json"
UPDATED_CFG_JSON = "update_cfg.json"
UPDATED_CFG_PB = "update_cfg.pb"
CFG_DELTA_ENV_JSON = "cfg_delta_env.json"
CFG_DELTA_ENV_PB = "cfg_delta_env.pb"


class ChannelViewSet(viewsets.ViewSet):
    """Class represents Channel related operations."""
    permission_classes = [IsAuthenticated, ]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @ swagger_auto_schema(
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
                    {"data": channels_list, "total": channels.count()})
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
                ConfigTxGen(org.network.name).channeltx(
                    profile=name, channelid=name, outputCreateChannelTx="{}.tx".format(name))
                tx_path = "{}/{}/channel-artifacts/{}.tx".format(
                    CELLO_HOME, org.network.name, name)
                block_path = "{}/{}/channel-artifacts/{}.block".format(
                    CELLO_HOME, org.network.name, name)
                ordering_node = Node.objects.get(id=orderers[0])
                peer_node = Node.objects.get(id=peers[0])
                envs = init_env_vars(peer_node, org)
                peer_channel_cli = PeerChannel("v2.2.0", **envs)
                peer_channel_cli.create(
                    channel=name,
                    orderer_url="{}.{}:{}".format(
                        ordering_node.name, org.name.split(".", 1)[1], str(7050)),
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
            channel = Channel.objects.get(id=pk)
            org = request.user.organization
            try:
                # Read uploaded file in cache without saving it on disk.
                file = request.FILES.get('data').read()
                json_data = file.decode('utf8').replace("'", '"')
                data = json.loads(json_data)
                msp_id = serializer.validated_data.get("msp_id")
                org_type = serializer.validated_data.get("org_type")
                # Validate uploaded config file
                try:
                    config = data["config"]["channel_group"]["groups"][org_type]["groups"][msp_id]
                except KeyError:
                    LOG.error("config file not found")
                    raise ResourceNotFound

                try:
                    # Read current channel config from local disk
                    with open(channel.get_channel_artifacts_path(CFG_JSON), 'r', encoding='utf-8') as f:
                        LOG.info("load current config success")
                        current_config = json.load(f)
                except FileNotFoundError:
                    LOG.error("current config file not found")
                    raise ResourceNotFound

                # Create a new org
                new_org = Organization.objects.create(
                    name=org.name,
                )
                LOG.info("new org created")
                updated_config = deepcopy(current_config)
                updated_config["channel_group"]["groups"]["Application"]["groups"][msp_id] = config
                LOG.info("update config success", updated_config)

                # Update and save the config with new org
                with open(channel.get_channel_artifacts_path(UPDATED_CFG_JSON), 'w', encoding='utf-8') as f:
                    LOG.info("save updated config success")
                    json.dump(updated_config, f, sort_keys=False)

                # Encode it into pb.
                ConfigTxLator().proto_encode(
                    input=channel.get_channel_artifacts_path(UPDATED_CFG_JSON),
                    type="common.Config",
                    output=channel.get_channel_artifacts_path(UPDATED_CFG_PB),
                )
                LOG.info("encode config to pb success")

                # Calculate the config delta between pb files
                ConfigTxLator().compute_update(
                    original=channel.get_channel_artifacts_path(CFG_PB),
                    updated=channel.get_channel_artifacts_path(UPDATED_CFG_PB),
                    channel_id=channel.name,
                    output=channel.get_channel_artifacts_path(DELTA_PB),
                )
                LOG.info("compute config delta success")
                # Decode the config delta pb into json
                config_update = ConfigTxLator().proto_decode(
                    input=channel.get_channel_artifacts_path(DELTA_PB),
                    type="common.ConfigUpdate",
                )
                LOG.info("decode config delta to json success")
                # Wrap the config update as envelope
                updated_config = {
                    "payload": {
                        "header": {
                            "channel_header": {
                                "channel_id": channel.name,
                                "type": 2,
                            }
                        },
                        "data": {
                            "config_update": to_dict(config_update)
                        }
                    }
                }
                with open(channel.get_channel_artifacts_path(CFG_JSON), 'w', encoding='utf-8') as f:
                    LOG.info("save config to json success")
                    json.dump(updated_config, f, sort_keys=False)

                # Encode the config update envelope into pb
                ConfigTxLator().proto_encode(
                    input=channel.get_channel_artifacts_path(CFG_JSON),
                    type="common.Envelope",
                    output=channel.get_channel_artifacts_path(CFG_DELTA_ENV_PB),
                )
                LOG.info("Encode the config update envelope success")

                # Peers to send the update transaction
                nodes = Node.objects.filter(
                    organization=org,
                    type=FabricNodeType.Peer.name.lower(),
                    status=NodeStatus.Running.name.lower()
                )

                for node in nodes:
                    dir_node = "{}/{}/crypto-config/peerOrganizations".format(
                        CELLO_HOME, org.name)
                    env = {
                        "FABRIC_CFG_PATH": "{}/{}/peers/{}/".format(dir_node, org.name, node.name + "." + org.name),
                    }
                    cli = PeerChannel("v2.2.0", **env)
                    cli.signconfigtx(
                        channel.get_channel_artifacts_path(CFG_DELTA_ENV_PB))
                    LOG.info("Peers to send the update transaction success")

                # Save a new organization to db.
                new_org.save()
                LOG.info("new_org save success")
                return Response(status=status.HTTP_202_ACCEPTED)
            except ObjectDoesNotExist:
                raise ResourceNotFound

    @swagger_auto_schema(
        responses=with_common_response({status.HTTP_200_OK: "Accepted"}),
    )
    @action(methods=["get"], detail=True, url_path="configs")
    def get_channel_org_config(self, request, pk=None):
        try:
            org = request.user.organization
            channel = Channel.objects.get(id=pk)
            path = channel.get_channel_config_path()
            node = Node.objects.filter(
                organization=org,
                type=FabricNodeType.Peer.name.lower(),
                status=NodeStatus.Running.name.lower()
            ).first()
            dir_node = "{}/{}/crypto-config/peerOrganizations".format(
                CELLO_HOME, org.name)
            env = {
                "FABRIC_CFG_PATH": "{}/{}/peers/{}/".format(dir_node, org.name, node.name + "." + org.name),
            }
            peer_channel_cli = PeerChannel("v2.2.0", **env)
            peer_channel_cli.fetch(option="config", channel=channel.name)

            # Decode latest config block into json
            config = ConfigTxLator().proto_decode(input=path, type="common.Block")
            config = parse_block_file(config)

            # Prepare return data
            data = {
                "config": config,
                "organization": org.name,
                # TODO: create a method on Organization or Node to return msp_id
                "msp_id": '{}'.format(org.name.split(".")[0].capitalize())
            }

            # Save as a json file for future usage
            with open(channel.get_channel_artifacts_path(CFG_JSON), 'w', encoding='utf-8') as f:
                json.dump(config, f, sort_keys=False)
            # Encode block file as pb
            ConfigTxLator().proto_encode(
                input=channel.get_channel_artifacts_path(CFG_JSON),
                type="common.Config",
                output=channel.get_channel_artifacts_path(CFG_PB),
            )
            return Response(data=data, status=status.HTTP_200_OK)
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
        # "Org1.cello.comMSP"
        "CORE_PEER_LOCALMSPID": "{}MSP".format(org_name.capitalize()),
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
