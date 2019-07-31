#
# SPDX-License-Identifier: Apache-2.0
#
import os
import json
from enum import Enum, unique

# deploy name in kubernetes
DEPLOY_NAME = os.getenv("DEPLOY_NAME")
# network type to deploy, support fabric
NETWORK_TYPE = os.getenv("NETWORK_TYPE")
# network version, for fabric support 1.4
NETWORK_VERSION = os.getenv("NETWORK_VERSION")
# node type
# fabric: ca, peer, orderer
NODE_TYPE = os.getenv("NODE_TYPE")
# configuration file for kubernetes agent
AGENT_CONFIG_FILE = os.getenv("AGENT_CONFIG_FILE")
AGENT_ID = os.getenv("AGENT_ID")
AGENT_IP = os.getenv("AGENT_IP")
NODE_ID = os.getenv("NODE_ID")
OPERATION = os.getenv("OPERATION")
TOKEN = os.getenv("TOKEN")
NODE_DETAIL_URL = os.getenv("NODE_DETAIL_URL")
NODE_FILE_URL = os.getenv("NODE_FILE_URL")
NODE_SERVICE_PORT = os.getenv("NODE_SERVICE_PORT")
NODE_UPLOAD_FILE_URL = os.getenv("NODE_UPLOAD_FILE_URL")
MAX_QUERY_RETRY = 30
FABRIC_CA_USER = json.loads(os.getenv("FABRIC_CA_USER", "{}"))
SERVICE_PORTS = json.loads(os.getenv("SERVICE_PORTS", "{}"))
USER_PATCH_URL = os.getenv("USER_PATCH_URL")

CA_CONFIG = json.loads(os.getenv("FABRIC_CA_CONFIG", "{}"))
PEER_CONFIG = json.loads(os.getenv("FABRIC_PEER_CONFIG", "{}"))
# Initial admin name/password for ca server
CA_ADMIN_NAME = CA_CONFIG.get("admin_name", "admin")
CA_ADMIN_PASSWORD = CA_CONFIG.get("admin_password", "adminpw")

headers = {
    "Authorization": "JWT %s" % TOKEN,
    "Content-Type": "application/json",
}


@unique
class AgentOperation(Enum):
    Create = "create"
    Start = "start"
    Stop = "stop"
    Query = "query"
    Update = "update"
    Delete = "delete"
    FabricCARegister = "fabric:ca:register"


@unique
class NodeStatus(Enum):
    Deploying = "deploying"
    Running = "running"
    Stopped = "stopped"
    Deleting = "deleting"
    Error = "error"


@unique
class NetworkType(Enum):
    Fabric = "fabric"
