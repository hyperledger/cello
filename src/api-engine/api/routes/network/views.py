#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import base64
import shutil
import os

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from django.core.paginator import Paginator
from django.core.exceptions import ObjectDoesNotExist
from api.exceptions import ResourceNotFound
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
from api.routes.network.serializers import (
    NetworkQuery,
    NetworkListResponse,
    NetworkOperationBody,
    ChannelBody,
    ChannelID,
    ChannelCreateBody,
    NetworkMemberResponse,
    NetworkCreateBody,
    NetworkIDSerializer,
)
from api.utils.common import with_common_response
from api.lib.configtxgen import ConfigTX, ConfigTxGen
from api.models import Network, Node, Organization
from api.config import CELLO_HOME
from api.utils import zip_dir, zip_file
from api.auth import TokenAuth
from api.lib.agent import AgentHandler

LOG = logging.getLogger(__name__)


class NetworkViewSet(viewsets.ViewSet):

    #authentication_classes = (JSONWebTokenAuthentication, TokenAuth)

    def _genesis2base64(self, network):
        """
        convert genesis.block to Base64

        :param network: network id
        :return: genesis block
        :rtype: bytearray
        """
        try:
            dir_node = "{}/{}/".format(CELLO_HOME, network)
            name = "genesis.block"
            zname = "block.zip"
            zip_file("{}{}".format(dir_node, name), "{}{}".format(dir_node, zname))
            with open("{}{}".format(dir_node, zname), "rb") as f_block:
                block = base64.b64encode(f_block.read())
            return block
        except Exception as e:
            raise e

    @swagger_auto_schema(
        query_serializer=NetworkQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NetworkListResponse})
        ),
    )
    def list(self, request):
        """
        List network

        :param request: query parameter
        :return: network list
        :rtype: list
        """
        serializer = NetworkQuery(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page", 1)
            per_page = serializer.validated_data.get("per_page", 10)
            name = serializer.validated_data.get("name")
            parameters = {}
            if name:
                parameters.update({"name__icontains": name})
            networks = Network.objects.filter(**parameters)
            p = Paginator(networks, per_page)
            networks = p.page(page)
            networks = [
                {
                    "id": network.id,
                    "name": network.name,
                    "created_at": network.created_at,
                }
                for network in networks
            ]
            response = NetworkListResponse(
                data={"total": p.count, "data": networks}
            )
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
                )
        return Response(data=[], status=status.HTTP_200_OK)

    def _agent_params(self, pk):
        """
        get node's params from db
        :param node: node id
        :return: info
        """
        try:
            node = Node.objects.get(id=pk)
            org = node.org
            if org is None:
                raise ResourceNotFound
            network = org.network
            if network is None:
                raise ResourceNotFound
            agent = org.agent.get()
            if agent is None:
                raise ResourceNotFound

            info = {}

            # get info of node, e.g, tls, msp, config.
            info["status"] = node.status
            info["msp"] = node.msp
            info["tls"] = node.tls
            info["config_file"] = node.config_file
            info["type"] = node.type
            info["name"] = node.name
            info["bootstrap_block"] = network.genesisblock
            info["urls"] = agent.urls
            info["network_type"] = network.type
            info["agent_type"] = agent.type
            return info
        except Exception as e:
            raise e

    def _start_node(self, pk):
        """
        start node from agent
        :param node: node id
        :return: null
        """
        try:
            infos = self._agent_params(pk)

            agent = AgentHandler(infos)
            cid = agent.create(infos)
            if cid:
                Node.objects.filter(id=pk).update(cid=cid)

            else:
                raise ResourceNotFound
        except Exception as e:
            raise e

    @swagger_auto_schema(
        request_body=NetworkCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: NetworkIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Network

        :param request: create parameter
        :return: organization ID
        :rtype: uuid
        """
        serializer = NetworkCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            consensus = serializer.validated_data.get("consensus")
            organizations = serializer.validated_data.get("organizations")
            database = serializer.validated_data.get("database")

            try:
                Network.objects.get(name=name)
            except ObjectDoesNotExist:
                pass
            orderers = []
            peers = []
            i = 0
            for organization in organizations:
                org = Organization.objects.get(pk=organization)
                orderers.append({"name": org.name, "hosts": []})
                peers.append({"name": org.name, "hosts": []})
                nodes = Node.objects.filter(org=org)
                for node in nodes:
                    if node.type == "peer":
                        peers[i]["hosts"].append({"name": node.name})
                    elif node.type == "orderer":
                        orderers[i]["hosts"].append({"name": node.name})
                i = i + 1

            ConfigTX(name).create(consensus=consensus, orderers=orderers, peers=peers)
            ConfigTxGen(name).genesis()

            block = self._genesis2base64(name)
            network = Network(name=name, consensus=consensus, organizations=organizations, genesisblock=block)
            network.save()

            for organization in organizations:
                Organization.objects.filter(pk=organization).update(network=network)
                org = Organization.objects.get(pk=organization)
                nodes = Node.objects.filter(org=org)
                for node in nodes:
                    try:
                        self._start_node(node.id)
                    except Exception as e:
                        print("err:", e)
                        pass

            response = NetworkIDSerializer(data=network.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_201_CREATED
                )

    @swagger_auto_schema(responses=with_common_response())
    def retrieve(self, request, pk=None):
        """
        Get Network

        Get network information
        """
        pass

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        )
    )
    def destroy(self, request, pk=None):
        try:
            network = Network.objects.get(pk=pk)
            path = "{}/{}".format(CELLO_HOME, network.name)
            if os.path.exists(path):
                shutil.rmtree(path, True)
            network.delete()
        except ObjectDoesNotExist:
            raise BaseException

        return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        methods=["get"],
        responses=with_common_response(
            {status.HTTP_200_OK: NetworkMemberResponse}
        ),
    )
    @swagger_auto_schema(
        methods=["post"],
        responses=with_common_response(
            {status.HTTP_200_OK: NetworkMemberResponse}
        ),
    )
    @action(methods=["get", "post"], detail=True, url_path="peers")
    def peers(self, request, pk=None):
        """
        get:
        Get Peers

        Get peers of network.
        post:
        Add New Peer

        Add peer into network
        """
        pass

    @swagger_auto_schema(
        methods=["delete"],
        responses=with_common_response(
            {status.HTTP_200_OK: NetworkMemberResponse}
        ),
    )
    @action(methods=["delete"], detail=True, url_path="peers/<str:peer_id>")
    def delete_peer(self, request, pk=None, peer_id=None):
        """
        delete:
        Delete Peer

        Delete peer in network
        """
        pass
