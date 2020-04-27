#
# SPDX-License-Identifier: Apache-2.0
#
import json
import logging

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db.models import Count, F
from django.urls import reverse
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication

from api.auth import IsOperatorAuthenticated
from api.common.enums import NodeStatus, AgentOperation
from api.exceptions import CustomError, NoResource, ResourceExists
from api.exceptions import ResourceNotFound
from api.models import (
    Agent,
    Node,
    Port,
    FabricCA,
    FabricNodeType,
    FabricCAServerType,
    NodeUser,
    FabricPeer,
    PeerCa,
    PeerCaUser,
)
from api.routes.node.serializers import (
    NodeOperationSerializer,
    NodeQuery,
    NodeCreateBody,
    NodeIDSerializer,
    NodeListSerializer,
    NodeUpdateBody,
    NodeFileCreateSerializer,
    NodeInfoSerializer,
    NodeUserCreateSerializer,
    NodeUserIDSerializer,
    NodeUserPatchSerializer,
    NodeUserQuerySerializer,
    NodeUserListSerializer,
)
from api.tasks import operate_node
from api.utils.common import with_common_response
from api.auth import CustomAuthenticate

LOG = logging.getLogger(__name__)


class NodeViewSet(viewsets.ViewSet):
    authentication_classes = (CustomAuthenticate, JSONWebTokenAuthentication)

    # Only operator can update node info
    def get_permissions(self):
        if self.action in ["update"]:
            permission_classes = (IsAuthenticated, IsOperatorAuthenticated)
        else:
            permission_classes = (IsAuthenticated,)

        return [permission() for permission in permission_classes]

    @staticmethod
    def _validate_organization(request):
        if request.user.organization is None:
            raise CustomError(detail="Need join in organization.")

    @swagger_auto_schema(
        query_serializer=NodeQuery,
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NodeListSerializer})
        ),
    )
    def list(self, request, *args, **kwargs):
        """
        List Nodes

        Filter nodes with query parameters.
        """
        serializer = NodeQuery(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")
            node_type = serializer.validated_data.get("type")
            name = serializer.validated_data.get("name")
            network_type = serializer.validated_data.get("network_type")
            network_version = serializer.validated_data.get("network_version")
            agent_id = serializer.validated_data.get("agent_id")

            if agent_id is not None and not request.user.is_operator:
                raise PermissionDenied
            query_filter = {}

            if node_type:
                query_filter.update({"type": node_type})
            if name:
                query_filter.update({"name__icontains": name})
            if network_type:
                query_filter.update({"network_type": network_type})
            if network_version:
                query_filter.update({"network_version": network_version})
            if request.user.is_administrator:
                query_filter.update(
                    {"organization": request.user.organization}
                )
            elif request.user.is_common_user:
                query_filter.update({"user": request.user})
            if agent_id:
                query_filter.update({"agent__id": agent_id})
            nodes = Node.objects.filter(**query_filter)
            p = Paginator(nodes, per_page)
            nodes = p.page(page)

            response = NodeListSerializer({"total": p.count, "data": nodes})
            return Response(data=response.data, status=status.HTTP_200_OK)

    def _save_fabric_ca(self, request, ca=None):
        if ca is None:
            return None

        ca_body = {}
        admin_name = ca.get("admin_name")
        admin_password = ca.get("admin_password")
        # If found tls type ca server under this organization,
        # will cause resource exists error
        ca_server_type = ca.get("type", FabricCAServerType.Signature.value)
        if ca_server_type == FabricCAServerType.TLS.value:
            exist_ca_server = Node.objects.filter(
                organization=request.user.organization,
                ca__type=FabricCAServerType.TLS.value,
            ).count()
            if exist_ca_server > 0:
                raise ResourceExists
        hosts = ca.get("hosts", [])
        if admin_name:
            ca_body.update({"admin_name": admin_name})
        if admin_password:
            ca_body.update({"admin_password": admin_password})
        fabric_ca = FabricCA(**ca_body, hosts=hosts, type=ca_server_type)
        fabric_ca.save()

        return fabric_ca

    def _save_fabric_peer(self, request, peer=None):
        if peer is None:
            return None
        name = peer.get("name")
        gossip_use_leader_reflection = peer.get("gossip_use_leader_reflection")
        gossip_org_leader = peer.get("gossip_org_leader")
        gossip_skip_handshake = peer.get("gossip_skip_handshake")
        local_msp_id = peer.get("local_msp_id")
        ca_nodes = peer.get("ca_nodes")

        body = {"name": name, "local_msp_id": local_msp_id}
        if gossip_use_leader_reflection is not None:
            body.update(
                {"gossip_use_leader_reflection": gossip_use_leader_reflection}
            )
        if gossip_org_leader is not None:
            body.update({"gossip_org_leader": gossip_org_leader})
        if gossip_skip_handshake is not None:
            body.update({"gossip_skip_handshake": gossip_skip_handshake})

        fabric_peer = FabricPeer(**body)
        fabric_peer.save()

        ca_nodes_list = []
        for ca_node in ca_nodes:
            node = ca_node.get("node")
            address = ca_node.get("address")
            certificate = ca_node.get("certificate")
            ca_type = ca_node.get("type")

            ca_body = {"peer": fabric_peer}
            ca_node_dict = {}
            if node is not None:
                ca_body.update({"node": node})
                port = Port.objects.filter(node=node, internal=7054).first()
                if port:
                    ca_node_dict.update(
                        {"address": "%s:%s" % (node.agent.ip, port.external)}
                    )
                ca_node_dict.update(
                    {
                        "type": node.ca.type,
                        "certificate": request.build_absolute_uri(
                            node.file.url
                        ),
                    }
                )
            else:
                update_body = {
                    "address": address,
                    "certificate": certificate,
                    "type": ca_type,
                }
                ca_body.update(update_body)
                ca_node_dict.update(update_body)

            peer_ca = PeerCa(**ca_body)
            peer_ca.save()
            users = ca_node.get("users")

            user_list = []
            for ca_user in users:
                ca_user_body = {"peer_ca": peer_ca}
                user_dict = {}
                user = ca_user.get("user")
                username = ca_user.get("username")
                password = ca_user.get("password")
                user_type = ca_user.get("type")

                if user is not None:
                    ca_user_body.update({"user": user})
                    user_dict.update(
                        {
                            "username": user.name,
                            "password": user.secret,
                            "type": user.user_type,
                        }
                    )
                else:
                    update_body = {
                        "username": username,
                        "password": password,
                        "type": user_type,
                    }
                    ca_user_body.update(update_body)
                    user_dict.update(update_body)
                user_list.append(user_dict)

                ca_user_obj = PeerCaUser(**ca_user_body)
                ca_user_obj.save()

            ca_node_dict.update({"users": user_list})

            ca_nodes_list.append(ca_node_dict)

        return fabric_peer, ca_nodes_list

    @swagger_auto_schema(
        request_body=NodeCreateBody,
        responses=with_common_response(
            {status.HTTP_201_CREATED: NodeIDSerializer}
        ),
    )
    def create(self, request):
        """
        Create Node

        Create node
        """
        serializer = NodeCreateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            self._validate_organization(request)
            agent_type = serializer.validated_data.get("agent_type")
            network_type = serializer.validated_data.get("network_type")
            network_version = serializer.validated_data.get("network_version")
            agent = serializer.validated_data.get("agent")
            node_type = serializer.validated_data.get("type")
            ca = serializer.validated_data.get("ca")
            peer = serializer.validated_data.get("peer")
            if agent is None:
                available_agents = (
                    Agent.objects.annotate(network_num=Count("node__network"))
                    .annotate(node_num=Count("node"))
                    .filter(
                        schedulable=True,
                        type=agent_type,
                        network_num__lt=F("capacity"),
                        node_num__lt=F("node_capacity"),
                        organization=request.user.organization,
                    )
                    .order_by("node_num")
                )
                if len(available_agents) > 0:
                    agent = available_agents[0]
                else:
                    raise NoResource
            else:
                if not request.user.is_operator:
                    raise PermissionDenied
                node_count = Node.objects.filter(agent=agent).count()
                if node_count >= agent.node_capacity or not agent.schedulable:
                    raise NoResource

            fabric_ca = None
            fabric_peer = None
            peer_ca_list = []
            if node_type == FabricNodeType.Ca.name.lower():
                fabric_ca = self._save_fabric_ca(request, ca)
            elif node_type == FabricNodeType.Peer.name.lower():
                fabric_peer, peer_ca_list = self._save_fabric_peer(
                    request, peer
                )
            node = Node(
                network_type=network_type,
                agent=agent,
                network_version=network_version,
                user=request.user,
                organization=request.user.organization,
                type=node_type,
                ca=fabric_ca,
                peer=fabric_peer,
            )
            node.save()
            agent_config_file = request.build_absolute_uri(
                agent.config_file.url
            )
            node_detail_url = reverse("node-detail", args=[str(node.id)])
            node_detail_url = request.build_absolute_uri(node_detail_url)
            node_file_upload_api = reverse("node-files", args=[str(node.id)])
            node_file_upload_api = request.build_absolute_uri(
                node_file_upload_api
            )
            operate_node.delay(
                str(node.id),
                AgentOperation.Create.value,
                agent_config_file=agent_config_file,
                node_detail_url=node_detail_url,
                node_file_upload_api=node_file_upload_api,
                peer_ca_list=json.dumps(peer_ca_list),
            )
            response = NodeIDSerializer({"id": str(node.id)})
            return Response(response.data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        methods=["post"],
        query_serializer=NodeOperationSerializer,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(methods=["post"], detail=True, url_path="operations")
    def operate(self, request, pk=None):
        """
        Operate Node

        Do some operation on node, start/stop/restart
        """
        pass

    @swagger_auto_schema(
        responses=with_common_response(
            {status.HTTP_204_NO_CONTENT: "No Content"}
        )
    )
    def destroy(self, request, pk=None):
        """
        Delete Node

        Delete node
        """
        try:
            if request.user.is_superuser:
                node = Node.objects.get(id=pk)
            else:
                node = Node.objects.get(
                    id=pk, organization=request.user.organization
                )
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            if node.status != NodeStatus.Deleting.name.lower():
                if node.status not in [
                    NodeStatus.Error.name.lower(),
                    NodeStatus.Deleted.name.lower(),
                ]:
                    node.status = NodeStatus.Deleting.name.lower()
                    node.save()

                    agent_config_file = request.build_absolute_uri(
                        node.agent.config_file.url
                    )
                    node_detail_url = reverse("node-detail", args=[pk])
                    node_detail_url = request.build_absolute_uri(
                        node_detail_url
                    )
                    operate_node.delay(
                        str(node.id),
                        AgentOperation.Delete.value,
                        agent_config_file=agent_config_file,
                        node_detail_url=node_detail_url,
                    )
                else:
                    node.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        operation_id="update node",
        request_body=NodeUpdateBody,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    def update(self, request, pk=None):
        """
        Update Node

        Update special node with id.
        """
        serializer = NodeUpdateBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            node_status = serializer.validated_data.get("status")
            ports = serializer.validated_data.get("ports", [])
            try:
                node = Node.objects.get(id=pk)
            except ObjectDoesNotExist:
                raise ResourceNotFound

            node.status = node_status
            node.save()

            for port_item in ports:
                port = Port(
                    external=port_item.get("external"),
                    internal=port_item.get("internal"),
                    node=node,
                )
                port.save()

            return Response(status=status.HTTP_202_ACCEPTED)

    @swagger_auto_schema(
        methods=["post"],
        request_body=NodeFileCreateSerializer,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(methods=["post"], detail=True, url_path="files", url_name="files")
    def upload_files(self, request, pk=None):
        """
        Upload file to node

        Upload related files to node
        """
        serializer = NodeFileCreateSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            file = serializer.validated_data.get("file")
            try:
                node = Node.objects.get(id=pk)
            except ObjectDoesNotExist:
                raise ResourceNotFound
            else:
                # delete old file
                if node.file:
                    node.file.delete()
                node.file = file
                node.save()

        return Response(status=status.HTTP_202_ACCEPTED)

    @swagger_auto_schema(
        responses=with_common_response(
            with_common_response({status.HTTP_200_OK: NodeInfoSerializer})
        )
    )
    def retrieve(self, request, pk=None):
        """
        Get Node information

        Get node detail information.
        """
        self._validate_organization(request)
        try:
            node = Node.objects.get(
                id=pk, organization=request.user.organization
            )
        except ObjectDoesNotExist:
            raise ResourceNotFound
        else:
            # Set file url of node
            if node.file:
                node.file = request.build_absolute_uri(node.file.url)
            ports = Port.objects.filter(node=node)
            node.links = [
                {
                    "internal_port": port.internal,
                    "url": "%s:%s" % (node.agent.ip, port.external),
                }
                for port in ports
            ]
            response = NodeInfoSerializer(node)
            return Response(data=response.data, status=status.HTTP_200_OK)

    def _register_user(self, request, pk=None):
        serializer = NodeUserCreateSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            secret = serializer.validated_data.get("secret")
            user_type = serializer.validated_data.get("user_type")
            attrs = serializer.validated_data.get("attrs", "")
            try:
                node = Node.objects.get(
                    id=pk, organization=request.user.organization
                )
                # Name is unique for each node
                user_count = NodeUser.objects.filter(
                    node=node, name=name
                ).count()
                if user_count > 0:
                    raise ResourceExists
            except ObjectDoesNotExist:
                raise ResourceNotFound

            node_user = NodeUser(
                name=name,
                secret=secret,
                user_type=user_type,
                attrs=attrs,
                node=node,
            )
            node_user.save()

            agent_config_file = request.build_absolute_uri(
                node.agent.config_file.url
            )
            node_file_url = request.build_absolute_uri(node.file.url)
            user_patch_url = self.reverse_action(
                "patch-user", kwargs={"pk": pk, "user_pk": node_user.id}
            )
            user_patch_url = request.build_absolute_uri(user_patch_url)
            operate_node.delay(
                str(node.id),
                AgentOperation.FabricCARegister.value,
                agent_config_file=agent_config_file,
                node_file_url=node_file_url,
                user_patch_url=user_patch_url,
                fabric_ca_user={
                    "name": name,
                    "secret": secret,
                    "type": user_type,
                    "attrs": attrs,
                },
            )
            response = NodeUserIDSerializer(node_user)
            return Response(data=response.data, status=status.HTTP_201_CREATED)

    def _list_user(self, request, pk=None):
        serializer = NodeUserQuerySerializer(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")
            name = serializer.validated_data.get("name")
            user_type = serializer.validated_data.get("user_type")
            user_status = serializer.validated_data.get("status")
            query_param = {"node__id": pk}
            if name is not None:
                query_param.update({"name__icontains": name})
            if user_type is not None:
                query_param.update({"user_type": user_type})
            if user_status is not None:
                query_param.update({"status": user_status})

            users = NodeUser.objects.filter(**query_param)
            p = Paginator(users, per_page)
            users = p.page(page)

            response = NodeUserListSerializer(
                {"data": users, "total": p.count}
            )
            return Response(response.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        methods=["post"],
        operation_description="Register user to node",
        operation_summary="Register user to node",
        request_body=NodeUserCreateSerializer,
        responses=with_common_response(
            {status.HTTP_201_CREATED: NodeUserIDSerializer}
        ),
    )
    @swagger_auto_schema(
        methods=["get"],
        operation_description="List user of node",
        operation_summary="List user of node",
        query_serializer=NodeUserQuerySerializer,
        responses=with_common_response(
            {status.HTTP_200_OK: NodeUserListSerializer}
        ),
    )
    @action(
        methods=["post", "get"],
        detail=True,
        url_path="users",
        url_name="users",
    )
    def users(self, request, pk=None):
        if request.method == "POST":
            return self._register_user(request, pk)
        elif request.method == "GET":
            return self._list_user(request, pk)

    @swagger_auto_schema(
        methods=["patch"],
        request_body=NodeUserPatchSerializer,
        responses=with_common_response({status.HTTP_202_ACCEPTED: "Accepted"}),
    )
    @action(
        methods=["patch"],
        detail=True,
        url_path="users/(?P<user_pk>[^/.]+)",
        url_name="patch-user",
    )
    def patch_user(self, request, pk=None, user_pk=None):
        """
        Patch user status for node

        Patch user status for node
        """
        serializer = NodeUserPatchSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            try:
                node_user = NodeUser.objects.get(id=user_pk, node__id=pk)
            except ObjectDoesNotExist:
                raise ResourceNotFound

            node_user.status = serializer.validated_data.get("status")
            node_user.save()

            return Response(status=status.HTTP_202_ACCEPTED)
