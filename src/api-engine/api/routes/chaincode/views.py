from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
import os

from drf_yasg.utils import swagger_auto_schema
from api.config import FABRIC_CHAINCODE_STORE

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
        query_serializer=PageQuerySerializer,
        responses=with_common_response(
            {status.HTTP_201_CREATED: ChainCodeIDSerializer}
        ),
    )
    def create(self, request):
        serializer = ChainCodePackageBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            name = serializer.validated_data.get("name")
            version = serializer.validated_data.get("version")
            language = serializer.validated_data.get("language")
            md5 = serializer.validated_data.get("md5")
            file = serializer.validated_data.get("file")
            try:
                # 把文件放入项目的media文件夹中
                file_path = os.path.join(FABRIC_CHAINCODE_STORE, md5)
                if not os.path.exists(file_path):
                    os.makedirs(file_path)
                with open(os.path.join(file_path, file.name), 'wb') as f:
                    for chunk in file.chunks():
                        f.write(chunk)
                    f.close()
            except Exception as e:
                return Response(
                    err(e.args), status=status.HTTP_400_BAD_REQUEST
                )
        return Response(
                    ok("success"), status=status.HTTP_200_OK
                )
