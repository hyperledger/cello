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


class RegisterViewSet(viewsets.ViewSet):

    def create(self, request):
        serializer = RegisterBody(data=request.data)
        if serializer.is_valid(raise_exception=True):
            username = serializer.validated_data.get("username")
            organization = serializer.validated_data.get("organization")
            password = serializer.validated_data.get("password")
            try:
                Organization.objects.get(name=organization)
            except ObjectDoesNotExist:
                pass
            else:
                raise ResourceExists

            CryptoConfig(organization).create()
            CryptoGen(organization).generate()

            msp, tls = self._conversion_msp_tls(organization)

            organization = Organization(name=organization, msp=msp, tls=tls)
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
                    response.validated_data, status=status.HTTP_201_CREATED
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