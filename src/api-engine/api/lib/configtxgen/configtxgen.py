#
# SPDX-License-Identifier: Apache-2.0
#
from subprocess import call
from api.config import CELLO_HOME, FABRIC_TOOL


class ConfigTxGen:
    """Class represents cryptotxgen."""

    def __init__(self, network, filepath=CELLO_HOME, configtxgen=FABRIC_TOOL, version="2.2.0"):
        """init CryptoGen
                param:
                    network: network's name
                    configtxgen: tool path
                    version: version
                    filepath: cello's working directory
                return:
        """
        self.network = network
        self.configtxgen = configtxgen + "/configtxgen"
        self.filepath = filepath
        self.version = version

    def genesis(self, profile="TwoOrgsOrdererGenesis", channelid="testchainid", outputblock="genesis.block"):
        """generate gensis
                param:
                    profile: profile
                    channelid: channelid
                    outputblock: outputblock
                return:
        """
        try:
            call([self.configtxgen, "-configPath", "{}/{}/".format(self.filepath, self.network),
                  "-profile", "{}".format(profile),
                  "-outputBlock", "{}/{}/{}".format(self.filepath, self.network, outputblock),
                  "-channelID", "{}".format(channelid)])
        except Exception as e:
            err_msg = "configtxgen genesis fail! "
            raise Exception(err_msg + str(e))

    def channeltx(self, profile, channelid, outputblock):
        """generate anchorpeer
                param:
                    profile: profile
                    channelid: channelid
                    outputblock: outputblock
                return:
        """
        pass

    def anchorpeer(self, profile, channelid, outputblock):
        """set anchorpeer
                param:
                    profile: profile
                    channelid: channelid
                    outputblock: outputblock
                return:
        """
        pass


if __name__ == "__main__":
    ConfigTxGen("test3").genesis()

