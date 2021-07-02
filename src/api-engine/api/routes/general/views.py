#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import base64

from rest_framework import viewsets, status
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.response import Response
from api.models import UserProfile, Organization
from api.exceptions import ResourceExists, ResourceNotFound, ResourceInUse
from api.routes.general.serializers import (
    RegisterBody,
    RegisterIDSerializer,
)
from api.lib.pki import CryptoGen, CryptoConfig
from api.utils import zip_dir, zip_file
from api.config import CELLO_HOME

LOG = logging.getLogger(__name__)


class RegisterViewSet(viewsets.ViewSet):

    def create(self, request):
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
            else:
                return Response(
                    "orgnization exists!", status=status.HTTP_409_CONFLICT
                )

            if password != passwordAgain:
                return Response(
                    "password error", status=status.HTTP_409_CONFLICT
                )

            organization = Organization(name=orgname)
            organization.save()

            user = UserProfile(
                username=username,
                role="Admin",
                organization=organization,
            )
            user.set_password(password)
            user.save()

            response = RegisterIDSerializer(data=organization.__dict__)
            if response.is_valid(raise_exception=True):
                return Response(
                    response.validated_data, status=status.HTTP_200_OK
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