#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import base64

from rest_framework import viewsets, status
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework_jwt.views import ObtainJSONWebToken
from api.models import UserProfile, Organization
from api.routes.general.serializers import (
    RegisterBody,
    RegisterResponse,

)
from api.lib.pki import CryptoGen, CryptoConfig
from api.utils import zip_dir
from api.common import ok, err
from api.config import CELLO_HOME
from api.utils.jwt import jwt_response_payload_handler
from datetime import datetime
from rest_framework_jwt.settings import api_settings
 


LOG = logging.getLogger(__name__)


class RegisterViewSet(viewsets.ViewSet):

    def create(self, request):
        try:
            serializer = RegisterBody(data=request.data)
            if serializer.is_valid(raise_exception=True):
                #username = serializer.validated_data.get("username")
                email = serializer.validated_data.get("email")
                orgname = serializer.validated_data.get("orgName")
                password = serializer.validated_data.get("password")

                try:
                    UserProfile.objects.get(email=email)
                except ObjectDoesNotExist:
                    pass
                except MultipleObjectsReturned:
                    return Response(
                        err("Email Aleady exists!"), status=status.HTTP_409_CONFLICT
                    )
                else:
                    return Response(
                        err("Email Aleady exists!"), status=status.HTTP_409_CONFLICT
                    )

                try:
                    Organization.objects.get(name=orgname)
                except ObjectDoesNotExist:
                    pass
                except MultipleObjectsReturned:
                    return Response(
                        err("Orgnization already exists!"), status=status.HTTP_409_CONFLICT
                    )
                else:
                    return Response(
                        err("Orgnization already exists!"), status=status.HTTP_409_CONFLICT
                    )
                

                
                CryptoConfig(orgname).create(0, 0)
                CryptoGen(orgname).generate()

                organization = Organization(name=orgname)
                organization.save()

                user = UserProfile(
                    username=email,
                    email=email,
                    role="admin",
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

class CustomObtainJSONWebToken(ObtainJSONWebToken):

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data
        )
        if serializer.is_valid():
            user = serializer.object.get('user') or request.user
            token = serializer.object.get('token')
            response_data = jwt_response_payload_handler(token, user, request)
            response = Response(response_data)
            if api_settings.JWT_AUTH_COOKIE:
                expiration = (datetime.utcnow() +
                              api_settings.JWT_EXPIRATION_DELTA)
                response.set_cookie(api_settings.JWT_AUTH_COOKIE,
                                    token,
                                    expires=expiration,
                                    httponly=True)
            return response
        return Response(err(serializer.errors), status=status.HTTP_400_BAD_REQUEST)
