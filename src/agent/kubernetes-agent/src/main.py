#
# SPDX-License-Identifier: Apache-2.0
#
from operations import create_node, delete_node, fabric_ca_register
from utils.env import OPERATION, AgentOperation

if __name__ == "__main__":
    if OPERATION == AgentOperation.Create.value:
        create_node()
    elif OPERATION == AgentOperation.Delete.value:
        delete_node()
    elif OPERATION == AgentOperation.FabricCARegister.value:
        fabric_ca_register()
