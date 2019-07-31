#
# SPDX-License-Identifier: Apache-2.0
#
import json
import subprocess
import tarfile

import requests

from utils import download_file
from utils.env import (
    NODE_FILE_URL,
    FABRIC_CA_USER,
    SERVICE_PORTS,
    CA_ADMIN_NAME,
    CA_ADMIN_PASSWORD,
    AGENT_IP,
    USER_PATCH_URL,
    headers,
)


def fabric_ca_register():
    if NODE_FILE_URL:
        node_file = download_file(NODE_FILE_URL, "/tmp")
        tf = tarfile.open(node_file)
        tf.extractall("/tmp")

        name = FABRIC_CA_USER.get("name")
        secret = FABRIC_CA_USER.get("secret")
        user_type = FABRIC_CA_USER.get("type")
        attrs = FABRIC_CA_USER.get("attrs", "")

        ca_service_port = SERVICE_PORTS.get("7054")

        enroll_cmd = [
            "fabric-ca-client",
            "enroll",
            "-d",
            "-u",
            "https://%s:%s@%s:%s"
            % (CA_ADMIN_NAME, CA_ADMIN_PASSWORD, AGENT_IP, ca_service_port),
        ]

        try:
            output = subprocess.check_call(enroll_cmd)
        except subprocess.CalledProcessError:
            requests.patch(
                url=USER_PATCH_URL,
                headers=headers,
                data=json.dumps({"status": "fail"}),
            )
            exit(-1)

        register_cmd = [
            "fabric-ca-client",
            "register",
            "-d",
            "--id.name",
            name,
            "--id.secret",
            secret,
            "--id.type",
            user_type,
        ]
        if attrs != "":
            register_cmd.append("--id.attrs")
            register_cmd.append(attrs)

        register_cmd.append("-u")
        register_cmd.append("https://%s:%s" % (AGENT_IP, ca_service_port))

        try:
            output = subprocess.check_output(register_cmd)
        except subprocess.CalledProcessError:
            requests.patch(
                url=USER_PATCH_URL,
                headers=headers,
                data=json.dumps({"status": "fail"}),
            )

        requests.patch(
            url=USER_PATCH_URL,
            headers=headers,
            data=json.dumps({"status": "registered"}),
        )
