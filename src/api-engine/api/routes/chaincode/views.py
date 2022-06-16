from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
import os
import zipfile

from drf_yasg.utils import swagger_auto_schema
#
# SPDX-License-Identifier: Apache-2.0
#
from api.config import FABRIC_CHAINCODE_STORE
from api.config import CELLO_HOME
from api.models import (
    Node,
    ChainCode
)
from api.utils.common import make_uuid
from django.core.paginator import Paginator

from api.lib.peer.chaincode import ChainCode as PeerChainCode
from api.common.serializers import PageQuerySerializer
from api.auth import TokenAuth
from api.utils.common import with_common_response
from api.exceptions import ResourceNotFound

from api.routes.chaincode.serializers import (
    ChainCodePackageBody,
    ChainCodeIDSerializer,
    ChainCodeCommitBody,
    ChainCodeApproveForMyOrgBody,
    ChaincodeListResponse
)
from api.common import ok, err


class ChainCodeViewSet(viewsets.ViewSet):
    """Class represents Channel related operations."""
    authentication_classes = (JSONWebTokenAuthentication, TokenAuth)

    @swagger_auto_schema(
        query_serializer=PageQuerySerializer,
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChaincodeListResponse}
        ),
    )
    def list(self, request):
        """
        List Chaincodes
        :param request: org_id
        :return: chaincode list
        :rtype: list
        """
        serializer = PageQuerySerializer(data=request.GET)
        if serializer.is_valid(raise_exception=True):
            page = serializer.validated_data.get("page")
            per_page = serializer.validated_data.get("per_page")

            try:
                org = request.user.organization
                chaincodes = ChainCode.objects.filter(
                    creator=org.name).order_by("create_ts")
                p = Paginator(chaincodes, per_page)
                chaincodes_pages = p.page(page)
                chanincodes_list = [
                    {
                        "id": chaincode.id,
                        "name": chaincode.name,
                        "version": chaincode.version,
                        "creator": chaincode.creator,
                        "language": chaincode.language,
                        "create_ts": chaincode.create_ts,
                        "md5": chaincode.md5,
                    }
                    for chaincode in chaincodes_pages
                ]
                response = ChaincodeListResponse({"data": chanincodes_list, "total": chaincodes.count()})
                return Response(data=ok(response.data), status=status.HTTP_200_OK)
            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )

    @swagger_auto_schema(
        method="post",
        query_serializer=PageQuerySerializer,
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['post'])
    def package(self, request):
        serializer = ChainCodePackageBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            version = serializer.validated_data.get("version")
            language = serializer.validated_data.get("language")
            md5 = serializer.validated_data.get("md5")
            file = serializer.validated_data.get("file")
            id = make_uuid()

            try:
                file_path = os.path.join(FABRIC_CHAINCODE_STORE, id)
                if not os.path.exists(file_path):
                    os.makedirs(file_path)
                fileziped = os.path.join(file_path, file.name)
                with open(fileziped, 'wb') as f:
                    for chunk in file.chunks():
                        f.write(chunk)
                    f.close()
                zipped_file = zipfile.ZipFile(fileziped)
                for filename in zipped_file.namelist():
                    zipped_file.extract(filename, file_path)

                # When there is go.mod in the chain code, execute the go mod vendor command to obtain dependencies.
                chaincode_path = file_path
                found = False
                for _, dirs, _ in os.walk(file_path):
                    if found:
                        break
                    elif dirs:
                        for each in dirs:
                            chaincode_path += "/"+each
                            if os.path.exists(chaincode_path+"/go.mod"):
                                cwd = os.getcwd()
                                print("cwd:", cwd)
                                os.chdir(chaincode_path)
                                os.system("go mod vendor")
                                found = True
                                os.chdir(cwd)
                                break
                # if can not find go.mod, use the dir after extract zipped_file
                if not found:
                    for _, dirs, _ in os.walk(file_path):
                        chaincode_path = file_path+"/"+dirs[0]
                        break

                org = request.user.organization
                qs = Node.objects.filter(type="peer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                peer_node = qs.first()
                envs = init_env_vars(peer_node, org)

                peer_channel_cli = PeerChainCode("v2.2.0", **envs)
                res = peer_channel_cli.lifecycle_package(name, version, chaincode_path, language)
                os.system("rm -rf {}/*".format(file_path))
                os.system("mv {}.tar.gz {}".format(name, file_path))
                if res != 0:
                    return Response(err("package chaincode failed."), status=status.HTTP_400_BAD_REQUEST)
                chaincode = ChainCode(
                    id=id,
                    name=name,
                    version=version,
                    language=language,
                    creator=org.name,
                    md5=md5
                )
                chaincode.save()
            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                          ok("success"), status=status.HTTP_200_OK
                )

    @swagger_auto_schema(
        method="post",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['post'])
    def install(self, request):
        chaincode_id = request.data.get("id")
        try:
            cc_targz = ""
            file_path = os.path.join(FABRIC_CHAINCODE_STORE, chaincode_id)
            for _, _, files in os.walk(file_path):
                cc_targz = os.path.join(file_path + "/" + files[0])
                break

            org = request.user.organization
            qs = Node.objects.filter(type="peer", organization=org)
            if not qs.exists():
                raise ResourceNotFound
            peer_node = qs.first()
            envs = init_env_vars(peer_node, org)

            peer_channel_cli = PeerChainCode("v2.2.0", **envs)
            res = peer_channel_cli.lifecycle_install(cc_targz)
            if res != 0:
                return Response(err("install chaincode failed."), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                err(e.args), status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            ok("success"), status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        method="get",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['get'])
    def query_installed(self, request):
        try:
            org = request.user.organization
            qs = Node.objects.filter(type="peer", organization=org)
            if not qs.exists():
                raise ResourceNotFound
            peer_node = qs.first()
            envs = init_env_vars(peer_node, org)

            timeout = "5s"
            peer_channel_cli = PeerChainCode("v2.2.0", **envs)
            res, installed_chaincodes = peer_channel_cli.lifecycle_query_installed(timeout)
            if res != 0:
                return Response(err("query installed chaincode failed."), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                err(e.args), status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            ok(installed_chaincodes), status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        method="get",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['get'])
    def get_installed_package(self, request):
        try:
            org = request.user.organization
            qs = Node.objects.filter(type="peer", organization=org)
            if not qs.exists():
                raise ResourceNotFound
            peer_node = qs.first()
            envs = init_env_vars(peer_node, org)

            timeout = "5s"
            peer_channel_cli = PeerChainCode("v2.2.0", **envs)
            res = peer_channel_cli.lifecycle_get_installed_package(timeout)
            if res != 0:
                return Response(err("get installed package failed."), status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                err(e.args), status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            ok("success"), status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        method="post",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['post'])
    def approve_for_my_org(self, request):
        serializer = ChainCodeApproveForMyOrgBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            try:
                channel_name = serializer.validated_data.get("channel_name")
                chaincode_name = serializer.validated_data.get("chaincode_name")
                chaincode_version = serializer.validated_data.get("chaincode_version")
                policy = serializer.validated_data.get("policy")
                # Perhaps the orderer's port is best stored in the database
                orderer_url = serializer.validated_data.get("orderer_url")
                sequence = serializer.validated_data.get("sequence")

                org = request.user.organization
                qs = Node.objects.filter(type="orderer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                orderer_node = qs.first()

                orderer_tls_dir = "{}/{}/crypto-config/ordererOrganizations/{}/orderers/{}/msp/tlscacerts" \
                                  .format(CELLO_HOME, org.name, org.name.split(".", 1)[1], orderer_node.name + "." +
                                          org.name.split(".", 1)[1])
                orderer_tls_root_cert = ""
                for _, _, files in os.walk(orderer_tls_dir):
                    orderer_tls_root_cert = orderer_tls_dir + "/" + files[0]
                    break
                qs = Node.objects.filter(type="peer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                peer_node = qs.first()
                envs = init_env_vars(peer_node, org)

                peer_channel_cli = PeerChainCode("v2.2.0", **envs)
                code, content = peer_channel_cli.lifecycle_approve_for_my_org(orderer_url, orderer_tls_root_cert, channel_name,
                                                                    chaincode_name, chaincode_version, policy, sequence)
                if code != 0:
                    return Response(err(" lifecycle_approve_for_my_org failed. err: "+content), status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                ok("success"), status=status.HTTP_200_OK
            )

    @swagger_auto_schema(
        method="get",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['get'])
    def query_approved(self, request):
        try:
            org = request.user.organization
            qs = Node.objects.filter(type="peer", organization=org)
            if not qs.exists():
                raise ResourceNotFound
            peer_node = qs.first()
            envs = init_env_vars(peer_node, org)

            channel_name = request.data.get("channel_name")
            cc_name = request.data.get("chaincode_name")

            peer_channel_cli = PeerChainCode("v2.2.0", **envs)
            code, content = peer_channel_cli.lifecycle_query_approved(channel_name, cc_name)
            if code != 0:
                return Response(err("query_approved failed."), status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                err(e.args), status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            ok(content), status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        method="post",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['post'])
    def check_commit_readiness(self, request):
        serializer = ChainCodeApproveForMyOrgBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            try:
                channel_name = serializer.validated_data.get("channel_name")
                chaincode_name = serializer.validated_data.get("chaincode_name")
                chaincode_version = serializer.validated_data.get("chaincode_version")
                policy = serializer.validated_data.get("policy")
                # Perhaps the orderer's port is best stored in the database
                orderer_url = serializer.validated_data.get("orderer_url")
                sequence = serializer.validated_data.get("sequence")
                org = request.user.organization
                qs = Node.objects.filter(type="orderer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                orderer_node = qs.first()

                orderer_tls_dir = "{}/{}/crypto-config/ordererOrganizations/{}/orderers/{}/msp/tlscacerts" \
                    .format(CELLO_HOME, org.name, org.name.split(".", 1)[1], orderer_node.name + "." +
                            org.name.split(".", 1)[1])

                orderer_tls_root_cert = ""
                for _, _, files in os.walk(orderer_tls_dir):
                    orderer_tls_root_cert = orderer_tls_dir + "/" + files[0]
                    break

                qs = Node.objects.filter(type="peer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                peer_node = qs.first()
                envs = init_env_vars(peer_node, org)

                peer_channel_cli = PeerChainCode("v2.2.0", **envs)
                code, content = peer_channel_cli.lifecycle_check_commit_readiness(orderer_url, orderer_tls_root_cert,
                                                                                  channel_name, chaincode_name,
                                                                                  chaincode_version, policy, sequence)
                if code != 0:
                    return Response(err("check_commit_readiness failed."), status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                ok(content), status=status.HTTP_200_OK
            )

    @swagger_auto_schema(
        method="post",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['post'])
    def commit(self, request):
        serializer = ChainCodeCommitBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            try:
                channel_name = serializer.validated_data.get("channel_name")
                chaincode_name = serializer.validated_data.get("chaincode_name")
                chaincode_version = serializer.validated_data.get("chaincode_version")
                policy = serializer.validated_data.get("policy")
                # Perhaps the orderer's port is best stored in the database
                orderer_url = serializer.validated_data.get("orderer_url")
                sequence = serializer.validated_data.get("sequence")
                peer_list = serializer.validated_data.get("peer_list")
                org = request.user.organization
                qs = Node.objects.filter(type="orderer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                orderer_node = qs.first()

                orderer_tls_dir = "{}/{}/crypto-config/ordererOrganizations/{}/orderers/{}/msp/tlscacerts" \
                    .format(CELLO_HOME, org.name, org.name.split(".", 1)[1], orderer_node.name + "." +
                            org.name.split(".", 1)[1])
                orderer_tls_root_cert = ""
                for _, _, files in os.walk(orderer_tls_dir):
                    orderer_tls_root_cert = orderer_tls_dir + "/" + files[0]
                    break
                
                qs = Node.objects.filter(type="peer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                peer_node = qs.first()
                envs = init_env_vars(peer_node, org)

                peer_root_certs = []
                peer_address_list = []
                for each in peer_list:
                    peer_node = Node.objects.get(id=each)
                    peer_tls_cert = "{}/{}/crypto-config/peerOrganizations/{}/peers/{}/tls/ca.crt" \
                                    .format(CELLO_HOME, org.name, org.name, peer_node.name + "." + org.name)
                    print(peer_node.port)
                    port = peer_node.port.all()[0].internal
                    # port = ports[0].internal
                    peer_address = peer_node.name + "." + org.name+":"+str(7051)
                    peer_address_list.append(peer_address)
                    peer_root_certs.append(peer_tls_cert)

                peer_channel_cli = PeerChainCode("v2.2.0", **envs)
                code = peer_channel_cli.lifecycle_commit(orderer_url, orderer_tls_root_cert, channel_name,
                                                                  chaincode_name, chaincode_version, policy,
                                                                  peer_address_list, peer_root_certs, sequence)
                if code != 0:
                    return Response(err("commit failed."), status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                ok("commit success."), status=status.HTTP_200_OK
            )

    @swagger_auto_schema(
        method="get",
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    @action(detail=False, methods=['get'])
    def query_committed(self, request):
            try:
                channel_name = request.data.get("channel_name")
                chaincode_name = request.data.get("chaincode_name")
                org = request.user.organization
                qs = Node.objects.filter(type="peer", organization=org)
                if not qs.exists():
                    raise ResourceNotFound
                peer_node = qs.first()
                envs = init_env_vars(peer_node, org)
                peer_channel_cli = PeerChainCode("v2.2.0", **envs)
                code, chaincodes_commited = peer_channel_cli.lifecycle_query_committed(channel_name, chaincode_name)
                if code != 0:
                    return Response(err("query committed failed."), status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response(
                err(e.args), status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                ok(chaincodes_commited), status=status.HTTP_200_OK
            )



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
        "CORE_PEER_LOCALMSPID": "{}MSP".format(org_name.capitalize()), # "Org1.cello.comMSP"
        "CORE_PEER_TLS_ROOTCERT_FILE": "{}/{}/peers/{}/tls/ca.crt".format(dir_node, org_name, node.name + "." + org_name),
        "CORE_PEER_ADDRESS": "{}:{}".format(
            node.name + "." + org_name, str(7051)),
        "CORE_PEER_MSPCONFIGPATH": "{}/{}/users/Admin@{}/msp".format(dir_node, org_name, org_name),
        "FABRIC_CFG_PATH": "{}/{}/peers/{}/".format(dir_node, org_name, node.name + "." + org_name),
        "ORDERER_CA": "{}/msp/tlscacerts/tlsca.{}-cert.pem".format(dir_certificate, org_domain)
    }
    return envs
