#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import base64
import json

from rest_framework import viewsets, status
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework_jwt.views import obtain_jwt_token, verify_jwt_token
from api.models import UserProfile, Organization
from rest_framework.authtoken.models import Token
from api.routes.general.serializers import (
    RegisterBody,
    RegisterIDSerializer,
    RegisterResponse,
    LoginBody,
)
from api.lib.pki import CryptoGen, CryptoConfig
from api.utils import zip_dir, zip_file
from api.common import ok, err
from api.config import CELLO_HOME

LOG = logging.getLogger(__name__)


class RegisterViewSet(viewsets.ViewSet):

    def create(self, request):
        try:
            serializer = RegisterBody(data=request.data)
            if serializer.is_valid(raise_exception=True):
                username = serializer.validated_data.get("username")
                orgname = serializer.validated_data.get("orgName")
                password = serializer.validated_data.get("password")
                passwordAgain = serializer.validated_data.get("passwordAgain")
                try:
                    Organization.objects.get(name=orgname)
                except ObjectDoesNotExist:
                    pass
                except Exception as e:
                    return Response(
                        err(e), status=status.HTTP_409_CONFLICT
                    )
                else:
                    return Response(
                        err("orgnization exists!"), status=status.HTTP_409_CONFLICT
                    )

                if password != passwordAgain:
                    return Response(
                        err(msg="password error"), status=status.HTTP_409_CONFLICT
                    )

                organization = Organization(name=orgname)
                organization.save()

                user = UserProfile(
                    username=username,
                    role="administrator",
                    organization=organization,
                )
                user.set_password(password)
                user.save()

                response = RegisterResponse(
                    data={"id": organization.id}
                )
                if response.is_valid(raise_exception=True):
                    return Response(
                        data=ok(response.validated_data), status=status.HTTP_200_OK
                    )
        except Exception as e:
            return Response(
                err(e.args), status=status.HTTP_400_BAD_REQUEST
            )


    def _conversion_msp_tls(self, name):
        """
        msp and tls from zip file to byte

        :param name: organization name
        :return: msp, tls
        :rtype: bytes
        """
        try:
            dir_org = "{}/{}/crypto-config/peerOrganizations/{}/" \
                .format(CELLO_HOME, name, name)

            zip_dir("{}msp".format(dir_org), "{}msp.zip".format(dir_org))
            with open("{}msp.zip".format(dir_org), "rb") as f_msp:
                msp = base64.b64encode(f_msp.read())

            zip_dir("{}tlsca".format(dir_org), "{}tls.zip".format(dir_org))
            with open("{}tls.zip".format(dir_org), "rb") as f_tls:
                tls = base64.b64encode(f_tls.read())
        except Exception as e:
            raise e

        return msp, tls


class LoginViewSet(viewsets.ViewSet):

    def create(self, request):
        try:
            serializer = LoginBody(data=request.data)
            if serializer.is_valid(raise_exception=True):
                username = serializer.validated_data.get("username")
                orgname = serializer.validated_data.get("orgName")
                password = serializer.validated_data.get("password")

                try:
                    organization = Organization.objects.get(name=orgname)
                except ObjectDoesNotExist:
                    return Response(
                        err("orgnization not exists!"), status=status.HTTP_409_CONFLICT
                    )
                try:
                    user = UserProfile.objects.get(username=username, organization=organization)
                    re = user.check_password(password)
                    if not re:
                        return Response(
                            err("login error!"), status=status.HTTP_403_FORBIDDEN
                        )
                except Exception as e:
                    return Response(
                        err("login error!"), status=status.HTTP_403_FORBIDDEN
                    )
                old_token = Token.objects.filter(user=user)
                old_token.delete()
                token = Token.objects.create(user=user)
                print(token)
                response = RegisterIDSerializer(data=organization.__dict__)
                if response.is_valid(raise_exception=True):
                    return Response(
                        ok(response.validated_data), status=status.HTTP_200_OK
                    )
        except Exception as e:
            return Response(
                err(e.args), status=status.HTTP_400_BAD_REQUEST
            )


@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            post_body = request.body
            json_result = json.loads(post_body)
            orgname = json_result.get("orgName")
            username = json_result.get("username")
            password = json_result.get("password")

            organization = Organization.objects.get(name=orgname)
            user = UserProfile.objects.get(username=username, organization=organization)
            re = user.check_password(password)
            if not re:
                return Response(
                    err("login error!"), status=status.HTTP_403_FORBIDDEN
                )
            token = obtain_jwt_token(request)
            return token
        except Exception as e:
            return Response(
                err(e.args), status=status.HTTP_403_FORBIDDEN
            )
