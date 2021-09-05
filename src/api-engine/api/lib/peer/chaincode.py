import os
import json
from api.lib.peer.basicEnv import BasicEnv
from api.config import FABRIC_TOOL, FABRIC_CFG


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

    def lifecycle_query_installed(self, timeout):
        """
            get the chaincode info installed in peer.
        :param timeout:
        :return: res 0 means success
                 installed_chaincodes: the json format of installed_chaincodes info
        """

        try:
            res = os.system("{} lifecycle chaincode queryinstalled --output json --connTimeout {}"
                            " > ./queryInstalled.txt".format(self.peer, timeout))
            with open('./queryInstalled.txt', 'r', encoding='utf-8') as f:
                content = f.read()
            os.system("rm ./queryInstalled.txt")
            installed_chaincodes = json.loads(content)
        except Exception as e:
            err_msg = "query_installed chaincode info failed for {}!".format(e)
            raise Exception(err_msg)
        return res, installed_chaincodes

    def lifecycle_get_installed_package(self, timeout):
        """
            lifecycle_query_installed will return a list installed in peer.
            then execute cmd to get all chaincode with tar.gz format installed in peer.
        :param timeout:
        :return: res_return: 0 means success get all chaincode in peers.
        """
        try:
            res, installed = self.lifecycle_query_installed("3s")
            res_return = 0
            if res == 0:
                for item in installed['installed_chaincodes']:
                    res_get = os.system("{} lifecycle chaincode getinstalledpackage --package-id {} "
                                        "--output-directory {} --connTimeout {}".format(self.peer,
                                                                                        item['package_id'], FABRIC_CFG, timeout))
                    res_get = res_get >> 8
                    res_return = res_return or res_get
            else:
                print("package_id get failed.")
                return 1, {}
        except Exception as e:
            err_msg = "get_installed_package failed for {}!".format(e)
            raise Exception(err_msg)
        return res_return

