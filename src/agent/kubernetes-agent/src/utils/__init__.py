#
# SPDX-License-Identifier: Apache-2.0
#
import os
import zipfile
from .env import AGENT_CONFIG_FILE, AGENT_ID
from .download import download_file
from .client import KubernetesClient


def prepare_config():
    config_path = "/app/.kube/config"

    if os.path.exists(config_path):
        return config_path

    config_file = download_file(AGENT_CONFIG_FILE, "/tmp")
    ext = os.path.splitext(config_file)[-1].lower()

    if ext == ".zip":
        with zipfile.ZipFile(config_file, "r") as zip_ref:
            zip_ref.extractall("/app")

    return config_path


def get_k8s_client():
    k8s_config = prepare_config()

    k8s_client = KubernetesClient(config_file=k8s_config)
    k8s_client.get_or_create_namespace(name=AGENT_ID)

    return k8s_client
