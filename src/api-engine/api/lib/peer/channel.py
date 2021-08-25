import os
from api.lib.peer.basicEnv import BasicEnv
from api.config import FABRIC_TOOL


class Channel(BasicEnv):
    """Call CMD to perform channel create, join and other related operations"""

    def __init__(self, version="2.2.0", peer=FABRIC_TOOL, **kwargs):
        self.peer = peer + "/peer"
        super(Channel, self).__init__(version, **kwargs)

    def create(self, channel, orderer_url, channel_tx, orderer_tls_rootcert, time_out="90s"):
        res = 0x100
        print("FABRIC_CFG_PATH", os.getenv("FABRIC_CFG_PATH"))
        print("CORE_PEER_TLS_ENABLED", os.getenv("CORE_PEER_TLS_ENABLED"))
        if os.getenv("CORE_PEER_TLS_ENABLED") == "false" or os.getenv("CORE_PEER_TLS_ENABLED") is None:
            res = os.system("{} channel create -c {} -o {} -f {} --timeout {}"
                                .format(self.peer, channel, orderer_url, channel_tx, time_out))
        else:
            res = os.system("{} channel create -c {} -o {} -f {} --timeout {} --tls --cafile {}"
                                .format(self.peer, channel, orderer_url, channel_tx, time_out, orderer_tls_rootcert))

        # The return value of os.system is not the result of executing the program. It is a 16 bit number,
        #  and its high bit is the return code
        res = res >> 8
        return res

    def list(self):
        res = os.system("{} channel list".format(self.peer))
        return res
