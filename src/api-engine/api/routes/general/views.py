#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import base64

from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from api.models import UserProfile, Organization
from api.routes.general.serializers import (
    RegisterBody,
    RegisterResponse,

)
from api.lib.pki import CryptoGen, CryptoConfig
from api.utils import zip_dir
from api.common import ok, err
from api.config import CELLO_HOME
from .serializers import (
    LoginBody,
    LoginSuccessBody,
)

LOG = logging.getLogger(__name__)


class RegisterViewSet(viewsets.ViewSet):
    def create(self, request):
        try:
            serializer = RegisterBody(data=request.data)
            if serializer.is_valid(raise_exception=True):
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


class CelloTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = LoginBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = authenticate(
                request,
                username=serializer.validated_data['email'],
                password=serializer.validated_data['password'])
            if user is not None:
                refresh = RefreshToken.for_user(user)
                data = {
                    'token': str(refresh.access_token),
                    'user': user,
                }
                response = LoginSuccessBody(instance=data)
                return Response(
                    data=ok(response.data),
                    status=200,
                )
        return super().post(request, *args, **kwargs)
