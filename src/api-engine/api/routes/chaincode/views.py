from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
import os
import zipfile

from drf_yasg.utils import swagger_auto_schema
from api.config import FABRIC_CHAINCODE_STORE
from api.config import CELLO_HOME
from api.models import (
    Node
)

from api.lib.peer.chaincode import ChainCode as PeerChainCode
from api.common.serializers import PageQuerySerializer
from api.auth import TokenAuth
from api.utils.common import with_common_response

from api.routes.chaincode.serializers import (
    ChainCodePackageBody,
    ChainCodeIDSerializer
)
from api.common import ok, err


class ChainCodeViewSet(viewsets.ViewSet):
    """Class represents Channel related operations."""
    authentication_classes = (JSONWebTokenAuthentication, TokenAuth)

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

            try:
                file_path = os.path.join(FABRIC_CHAINCODE_STORE, md5)
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
                                os.system("go mod vendor")
                                found = True
                                break
                # if can not find go.mod, use the dir after extract zipped_file
                if not found:
                    for _, dirs, _ in os.walk(file_path):
                        chaincode_path = file_path+"/"+dirs[0]
                        break

                org = request.user.organization
                peer_node = Node.objects.get(type="peer", organization=org.id)
                envs = init_env_vars(peer_node, org)

                peer_channel_cli = PeerChainCode("v2.2.0", **envs)
                res = peer_channel_cli.lifecycle_package(name, version, chaincode_path, language)
                os.system("rm -rf {}".format(file_path))
                if res != 0:
                    return Response(err("package chaincode failed."), status=status.HTTP_400_BAD_REQUEST)
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
            peer_node = Node.objects.get(type="peer", organization=org.id)
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
            peer_node = Node.objects.get(type="peer", organization=org.id)
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
