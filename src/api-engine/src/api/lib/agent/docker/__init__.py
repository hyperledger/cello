#
# SPDX-License-Identifier: Apache-2.0
#
from api.lib.agent.base import AgentBase


class DockerAgent(AgentBase):
    def __init__(self):
        super(AgentBase, self).__init__()

    def create(self, *args, **kwargs):
        pass

    def start(self, *args, **kwargs):
        pass

    def stop(self, *args, **kwargs):
        pass

    def delete(self, *args, **kwargs):
        pass
