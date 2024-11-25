#
# SPDX-License-Identifier: Apache-2.0
#
import hashlib
import os

from drf_yasg import openapi
from rest_framework import status
from rest_framework import serializers
from rest_framework.permissions import BasePermission
from functools import reduce, partial
from api.common.serializers import BadResponseSerializer
import uuid
from zipfile import ZipFile
from json import loads


def make_uuid():
    return str(uuid.uuid4())


def random_name(prefix=""):
    return "%s-%s" % (prefix, uuid.uuid4().hex)


def with_common_response(responses=None):
    if responses is None:
        responses = {}

    responses.update(
        {
            status.HTTP_400_BAD_REQUEST: BadResponseSerializer,
            status.HTTP_401_UNAUTHORIZED: "Permission denied",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Internal Error",
            status.HTTP_403_FORBIDDEN: "Authentication credentials "
            "were not provided.",
        }
    )

    return responses


basic_type_info = [
    (serializers.CharField, openapi.TYPE_STRING),
    (serializers.BooleanField, openapi.TYPE_BOOLEAN),
    (serializers.IntegerField, openapi.TYPE_INTEGER),
    (serializers.FloatField, openapi.TYPE_NUMBER),
    (serializers.FileField, openapi.TYPE_FILE),
    (serializers.ImageField, openapi.TYPE_FILE),
]


def to_form_paras(self):
    custom_paras = []
    for field_name, field in self.fields.items():
        type_str = openapi.TYPE_STRING
        for field_class, type_format in basic_type_info:
            if isinstance(field, field_class):
                type_str = type_format
        help_text = getattr(field, "help_text")
        default = getattr(field, "default", None)
        required = getattr(field, "required")
        if callable(default):
            custom_paras.append(
                openapi.Parameter(
                    field_name,
                    openapi.IN_FORM,
                    help_text,
                    type=type_str,
                    required=required,
                )
            )
        else:
            custom_paras.append(
                openapi.Parameter(
                    field_name,
                    openapi.IN_FORM,
                    help_text,
                    type=type_str,
                    required=required,
                    default=default,
                )
            )
    return custom_paras


def any_of(*perm_classes):
    """Returns permission class that allows access for
       one of permission classes provided in perm_classes"""

    class Or(BasePermission):
        def has_permission(*args):
            allowed = [p.has_permission(*args) for p in perm_classes]
            return reduce(lambda x, y: x or y, allowed)

    return Or


def hash_file(file, block_size=65536):
    hash_func = hashlib.md5()
    for buf in iter(partial(file.read, block_size), b""):
        hash_func.update(buf)

    return hash_func.hexdigest()


def zip_dir(dirpath, outFullName):
    """
    Compress the specified folder
    :param dirpath: specified folder
    :param outFullName: Save path+xxxx.zip
    :return: null
    """
    dir_dst = "/" + dirpath.rsplit("/", 1)[1]
    zdir = ZipFile(outFullName, "w")
    for path, dirnames, filenames in os.walk(dirpath):
        fpath = dir_dst + path.replace(dirpath, '')
        for filename in filenames:
            zdir.write(os.path.join(path, filename),
                       os.path.join(fpath, filename))
        # zip empty folder
        for dirname in dirnames:
            zdir.write(os.path.join(path, dirname),
                       os.path.join(fpath, dirname))
    zdir.close()


def zip_file(dirpath, outFullName):
    """
    Compress the specified file
    :param dirpath: specified folder of file
    :param outFullName: Save path+filename.zip
    :return: null
    """
    zfile = ZipFile(outFullName, "w")
    zfile.write(dirpath, dirpath.rsplit("/", 1)[1])
    zfile.close()


def parse_block_file(data):
    """
    Parse org config from channel config block.

    :param data: channel config block in json format.
    :param org_name: the organization prefix name
    :return organization config
    """
    config = loads(data)
    if config.get("data"):
        return config.get("data").get("data")[0].get("payload").get("data").get("config")
    return {"error": "can't find channel config"}


def to_dict(data):
    return loads(data)
