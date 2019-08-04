#
# SPDX-License-Identifier: Apache-2.0
#
from time import sleep
import os
from uuid import uuid4
from utils.env import (
    NODE_FILE_URL,
    FABRIC_CA_USER,
    SERVICE_PORTS,
    CA_ADMIN_NAME,
    CA_ADMIN_PASSWORD,
    AGENT_IP,
    USER_PATCH_URL,
    FabricImages,
    TOKEN,
    AGENT_ID,
    NETWORK_VERSION,
    MAX_QUERY_RETRY,
)
from utils import get_k8s_client


def fabric_ca_register():
    if NODE_FILE_URL:
        ca_service_port = SERVICE_PORTS.get("7054")
        pod_environments = [
            {"name": "NODE_FILE_URL", "value": NODE_FILE_URL},
            {"name": "CA_ADMIN_NAME", "value": CA_ADMIN_NAME},
            {"name": "CA_ADMIN_PASSWORD", "value": CA_ADMIN_PASSWORD},
            {"name": "CA_USER_NAME", "value": FABRIC_CA_USER.get("name")},
            {
                "name": "CA_USER_PASSWORD",
                "value": FABRIC_CA_USER.get("secret"),
            },
            {"name": "CA_USER_TYPE", "value": FABRIC_CA_USER.get("type")},
            {
                "name": "CA_USER_ATTRS",
                "value": FABRIC_CA_USER.get("attrs", ""),
            },
            {"name": "TOKEN", "value": TOKEN},
            {"name": "USER_PATCH_URL", "value": USER_PATCH_URL},
            {
                "name": "FABRIC_CA_CLIENT_TLS_CERTFILES",
                "value": "/tmp/crypto/ca-cert.pem",
            },
            {"name": "FABRIC_CA_CLIENT_HOME", "value": "/tmp/admin"},
            {
                "name": "CA_SERVER",
                "value": "%s:%s" % (AGENT_IP, ca_service_port),
            },
        ]
        pod_command = ["bash", "-c"]
        script_file_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "fabric_ca_register.sh"
        )
        with open(script_file_path, "r") as initial_ca_script:
            shell_script = initial_ca_script.read()
        pod_command_args = [shell_script]
        job_name = "register-ca-%s" % uuid4().hex
        template = {
            "name": job_name,
            "containers": [
                {
                    "name": "register",
                    "image": "%s:%s"
                    % (FabricImages.Ca.value, NETWORK_VERSION),
                    "command": pod_command,
                    "command_args": pod_command_args,
                    "environments": pod_environments,
                }
            ],
        }
        client = get_k8s_client()
        client.create_job(AGENT_ID, **template)

        for i in range(1, MAX_QUERY_RETRY):
            pod = client.get_pod(AGENT_ID, job_name)
            if pod.status.phase == "Succeeded":
                client.delete_job(AGENT_ID, job_name)
                break
            sleep(5)
