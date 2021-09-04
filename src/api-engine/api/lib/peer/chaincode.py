import os
from api.lib.peer.basicEnv import BasicEnv
from api.config import FABRIC_TOOL


class ChainCode(BasicEnv):
    def __init__(self, version="2.2.0", peer=FABRIC_TOOL, **kwargs):
        self.peer = peer + "/peer"
        super(ChainCode, self).__init__(version, **kwargs)

    def lifecycle_package(self, cc_name, cc_path, language, label):
        """
            package the chaincode to a tar.gz file.
        :param cc_name: chaincode name
        :param cc_path: where the chaincode is
        :param language: Chain code development language, default: golang
        :param label: Label of the generated chain code package
        :return 0 means success.
        """
        try:
            res = os.system("{} lifecycle chaincode package {}.tar.gz --path {} --lang {} --label {}"
                            .format(self.peer, cc_name, cc_path, language, label))
            res = res >> 8
        except Exception as e:
            err_msg = "package chaincode failed for {}!".format(e)
            raise Exception(err_msg)
        return res

    def lifecycle_install(self, cc_targz):
        """
            install the chaincode to peer.
        :param cc_targz: chaincode name wich accessible path
        :return: 0 means success.
        """
        try:
            res = os.system("{} lifecycle chaincode install {}".format(self.peer, cc_targz))
            res = res >> 8
        except Exception as e:
            err_msg = "install chaincode failed for {}!".format(e)
            raise Exception(err_msg)
        return res
