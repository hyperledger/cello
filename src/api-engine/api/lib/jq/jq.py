#
# SPDX-License-Identifier: Apache-2.0
#

from subprocess import call
import logging

LOG = logging.getLogger(__name__)

class JQ:
    def __init__(self):
        self.jq = "jq"

    def filter(self, input, output, expression):
        """
        Filter the input file with the given expression and write the output to the given file.
        """
        try:
            command = [self.jq,
                       expression,
                       input,
                       ">", output]
            
            LOG.info(" ".join(command))

            call(command)
        except Exception as e:
            err_msg = "jq filter fail! "
            raise Exception(err_msg + str(e))
