#
# SPDX-License-Identifier: Apache-2.0
#
from subprocess import call
from api.config import FABRIC_TOOL


class ConfigTxLator:
    """
    Class represents configtxlator CLI.
    """

    def __init__(self, filepath="", configtxlator=FABRIC_TOOL, version="2.2.0"):
        self.configtxlator = configtxlator + "/configtxlator"
        self.filepath = filepath
        self.version = version

    def proto_encode(self, input, type, output):
        """
        Converts a JSON document to protobuf.

        params:
            input: A file containing the JSON document.
            type:  The type of protobuf structure to encode to. For example, 'common.Config'.
            output: A file to write the output to.
        """
        try:
            call([self.configtxlator,
                  "--input", "{}/{}".format(self.filepath, input),
                  "--type", type,
                  "--output", "{}/{}".format(self.filepath, output),
                  ])
        except Exception as e:
            err_msg = "configtxlator proto decode fail! "
            raise Exception(err_msg + str(e))

    def proto_decode(self, input, type, output):
        """
        Converts a proto message to JSON.

        params:
            input: A file containing the JSON document.
            type:  The type of protobuf structure to decode to. For example, 'common.Config'.
            output: A file to write the output to.
        """
        try:
            call([self.configtxlator,
                  "--input", "{}/{}".format(self.filepath, input),
                  "--type", type,
                  "--output", "{}/{}".format(self.filepath, output),
                  ])
        except Exception as e:
            err_msg = "configtxlator proto decode fail! "
            raise Exception(err_msg + str(e))

    def compute_update(self, original, updated, channel_id, output):
        """
        Takes two marshaled common.Config messages and computes the config update which
        transitions between the two.

        params:
            original: The original config message.
            updated: The updated config message.
            channel_id: The name of the channel for this update.
            output: A file to write the JSON document to.
        """
        try:
            call([self.configtxlator,
                  "--original", original,
                  "--updated", updated,
                  "--channel_id", channel_id,
                  "--output", "{}/{}".format(self.filepath, output)
                  ])
        except Exception as e:
            err_msg = "configtxlator compute update fail! "
            raise Exception(err_msg + str(e))
