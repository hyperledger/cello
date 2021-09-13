import os
import json
import subprocess
from api.lib.peer.basicEnv import BasicEnv
from api.config import FABRIC_TOOL, FABRIC_CFG


class ChainCode(BasicEnv):
    def __init__(self, version="2.2.0", peer=FABRIC_TOOL, **kwargs):
        self.peer = peer + "/peer"
        super(ChainCode, self).__init__(version, **kwargs)

    def lifecycle_package(self, cc_name, cc_version, cc_path, language):
        """
            package the chaincode to a tar.gz file.
        :param cc_name: chaincode name
        :param cc_version: chaincode version
        :param cc_path: where the chaincode is
        :param language: Chain code development language, default: golang
        :return 0 means success.
        """
        try:
            label = cc_name+"_"+cc_version
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
            res = subprocess.Popen("{} lifecycle chaincode queryinstalled --output json --connTimeout {}"
                                   .format(self.peer, timeout), shell=True,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            stdout, stderr = res.communicate()
            return_code = res.returncode

            if return_code == 0:
                content = str(stdout, encoding="utf-8")
                installed_chaincodes = json.loads(content)
            else:
                stderr = str(stderr, encoding="utf-8")
                return return_code, stderr
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

    def lifecycle_approve_for_my_org(self, orderer_url, orderer_tls_rootcert, channel_name, cc_name,
                                     chaincode_version, policy, sequence=1):
        """
        The administrator can use the peer lifecycle chaincode approveformyorg subcommand to approve the chain code on
        behalf of the organization.
        :param orderer_url: orderer accessable url
        :param orderer_tls_rootcert: orderer tls certificate
        :param channel_name: channel name
        :param cc_name: chaincode name
        :param chaincode_version: chaincode version
        :param policy: chaincode policy
        :param sequence: The channel chain code defines the serial number. The default value is 1
        :return:
        """
        try:
            res, installed = self.lifecycle_query_installed("3s")
            cc_label = cc_name+"_"+chaincode_version
            package_id = ""
            for each in installed['installed_chaincodes']:
                if each['label'] == cc_label:
                    package_id = each['package_id']
                    break
            if package_id == "":
                return 1, "not exist the chaincode, please check chaincode_name and chaincode_version"

            if os.getenv("CORE_PEER_TLS_ENABLED") == "false" or os.getenv("CORE_PEER_TLS_ENABLED") is None:
                res = subprocess.Popen("{} lifecycle chaincode approveformyorg -o {} - --channelID {} --name {} "
                                       "--version {} --init-required --package-id {} --sequence {} --signature-policy {}"
                                       .format(self.peer, orderer_url, channel_name, cc_name, chaincode_version, package_id,
                                               sequence, policy), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            else:
                res = subprocess.Popen("{} lifecycle chaincode approveformyorg -o {} --tls --cafile {} --channelID {} "
                                       "--name {} --version {} --init-required --package-id {} --sequence {} "
                                       "--signature-policy {}"
                                       .format(self.peer, orderer_url, orderer_tls_rootcert, channel_name,
                                               cc_name, chaincode_version, package_id, sequence, policy), shell=True,
                                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = res.communicate()
            return_code = res.returncode

            if return_code == 0:
                content = str(stdout, encoding="utf-8")
            else:
                stderr = str(stderr, encoding="utf-8")
                return return_code, stderr
        except Exception as e:
            err_msg = "lifecycle_approve_for_my_org failed for {}!".format(e)
            raise Exception(err_msg)
        return return_code, content

    def lifecycle_query_approved(self, channel_name, cc_name):
        """
         query_approved chaincode information.
        :param channel_name: channel name
        :param cc_name: chaincode name
        :return:
        """

        try:
            res = subprocess.Popen("{} lifecycle chaincode queryapproved --output json --channelID {}"
                                   " --name {}".format(self.peer, channel_name, cc_name),
                                   shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = res.communicate()
            return_code = res.returncode
            if return_code == 0:
                content = str(stdout, encoding="utf-8")
                chaincodes_info = json.loads(content)
            else:
                stderr = str(stderr, encoding="utf-8")
                return return_code, stderr
        except Exception as e:
            err_msg = "lifecycle_query_approved failed for {}!".format(e)
            raise Exception(err_msg)

        return return_code, chaincodes_info

    def lifecycle_check_commit_readiness(self, orderer_url, orderer_tls_rootcert, channel_name, cc_name, cc_version,
                                         policy, sequence=1):
        """

        :param orderer_url:orderer accessable url
        :param orderer_tls_rootcert:orderer tls certificate
        :param channel_name:channel name
        :param cc_name: channel name
        :param cc_version: chaincode version
        :param policy:chaincode policy
        :param sequence:The channel chain code defines the serial number. The default value is 1
        :return:
        """
        try:
            if os.getenv("CORE_PEER_TLS_ENABLED") == "false" or os.getenv("CORE_PEER_TLS_ENABLED") is None:
                res = subprocess.Popen("{} lifecycle chaincode checkcommitreadiness --output json "
                                       " --channelID {}  --name {} --version {} --init-required --sequence {} "
                                       "--signature-policy {}"
                                       .format(self.peer, channel_name, cc_name, cc_version, sequence, policy),
                                       shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = res.communicate()
                return_code = res.returncode
                if return_code == 0:
                    content = str(stdout, encoding="utf-8")
                    chaincodes_info = json.loads(content)
                    return return_code, chaincodes_info
                else:
                    stderr = str(stderr, encoding="utf-8")
                    return return_code, stderr
            else:
                res = subprocess.Popen("{} lifecycle chaincode checkcommitreadiness --output json "
                                       "-o {} --tls --cafile {} --channelID {}  --name {} --version {} "
                                       "--signature-policy {} --init-required --sequence {}"
                                       .format(self.peer, orderer_url, orderer_tls_rootcert, channel_name, cc_name,
                                               cc_version, policy, sequence),
                                       shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = res.communicate()
                return_code = res.returncode
                if return_code == 0:
                    content = str(stdout, encoding="utf-8")
                    chaincodes_info = json.loads(content)
                    return return_code, chaincodes_info
                else:
                    stderr = str(stderr, encoding="utf-8")
                    return return_code, stderr
        except Exception as e:
            err_msg = "lifecycle_check_commit_readiness failed for {}!".format(e)
            raise Exception(err_msg)

    def lifecycle_commit(self, orderer_url, orderer_tls_rootcert, channel_name, cc_name, chaincode_version,
                         policy, peerlist, peer_root_certs, sequency=1):
        """
        The administrator can submit the chain code definition to the specified channel by using the peer lifecycle
        chain code commit subcommand
        :param orderer_url: orderer accessable url
        :param orderer_tls_rootcert:orderer tls certificate
        :param channel_name:channel name
        :param cc_name:channel name
        :param chaincode_version:chaincode version
        :param policy:chaincode policy
        :param peerlist: the list of peerAddress
        :param peer_root_certs: the list of peer_root_certs, the orderer should be same as peerlist's.
        :param sequency:The channel chain code defines the serial number. The default value is 1
        :return:
        """
        try:
            peer_addresses_format = " --peerAddresses {} --tlsRootCertFiles {}"
            command_str_with_tls = "{} lifecycle chaincode commit -o {} --tls --cafile {} " \
                                   "--channelID {} --name {} --version {} --init-required --sequence {} " \
                                   "--signature-policy {}"
            command_str_without_tls = "{} lifecycle chaincode commit -o {} --channelID {} --name {} " \
                                      "--version {} --init-required --sequence {} --signature-policy {}"

            peer_addressed = []
            for i in range(len(peerlist)):
                peer_addressed.append(peerlist[i])
                peer_addressed.append(peer_root_certs[i])
            if os.getenv("CORE_PEER_TLS_ENABLED") == "false" or os.getenv("CORE_PEER_TLS_ENABLED") is None:
                for i in range(len(peerlist)):
                    command_str_without_tls = command_str_without_tls + peer_addresses_format
                res = os.system(command_str_without_tls.format(self.peer, orderer_url, channel_name, cc_name,
                                chaincode_version, sequency, policy, *peer_addressed))      #--collections-config {}
            else:
                for i in range(len(peerlist)):
                    command_str_with_tls = command_str_with_tls + peer_addresses_format
                res = os.system(command_str_with_tls.format(self.peer, orderer_url, orderer_tls_rootcert, channel_name,
                                cc_name, chaincode_version, sequency, policy, *peer_addressed))
        except Exception as e:
            err_msg = "lifecycle_commit failed for {}!".format(e)
            raise Exception(err_msg)
        res = res >> 8
        return res
