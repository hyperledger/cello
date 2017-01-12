#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

from __future__ import print_function
from hyperledger.client import Client

# import base64
import json
import sys
import time

API_URL = 'http://127.0.0.1:5000'


def query_value(chaincode_name, arg_list):
    """
    Query a list of values.

    :param chaincode_name: The name of the chaincode.
    :param arg_list: List of arguments.
    :return: A list of values.
    """
    result, resp = [], {}
    print("Query value will try at most 20 times.")
    for arg in arg_list:
        for i in range(20):
            try:
                resp = c.chaincode_query(chaincode_name=chaincode_name,
                                         function="query",
                                         args=[arg])
                if resp['result']['status'] == 'OK':
                    result.append(resp['result']['message'])
                    break
            except KeyError:
                print("Wait 1 seconds for the {0} query".format(i))
                time.sleep(1)

    return result


# Usage:
# * python function_test.py [API_URL=http://127.0.0.1:5000] will deploy first
# * python function_test.py [API_URL=http://127.0.0.1:5000] [chaincode_name]
# E.g.,
# "f389486d91f54d1f8775940f24b1d3bd9f8a8e75d364e158ac92328ddacad629607a3c42be156fc4a7da7173adca2ac7d7eef29afc59c6f07f3ad14abee34f68"
if __name__ == '__main__':
    if len(sys.argv) not in [2, 3]:
        print("Usage: python function_test.py ["
              "API_URL=http://127.0.0.1:5000] [chaincode_name]")
        exit()

    API_URL = sys.argv[1]
    chaincode_name = ""
    if len(sys.argv) == 3:
        chaincode_name = sys.argv[2]

    c = Client(base_url=API_URL)

    print("Checking cluster at {}".format(API_URL))

    if not chaincode_name:
        print(">>>Test: deploy the default chaincode")
        res = c.chaincode_deploy(args=["a", "10000", "b", "20000"])
        chaincode_name = res['result']['message']
        assert res['result']['status'] == 'OK'
        print("Successfully deploy chaincode with returned name = " +
              chaincode_name)
        print("Wait 15 seconds to make sure deployment is done.")
        time.sleep(15)

    print(">>>Check the initial value: a, b")
    values = query_value(chaincode_name, ["a", "b"])
    print(values)
    assert values == ['10000', '20000']

    print(">>>Test: invoke a chaincode: a-->b 1")
    res = c.chaincode_invoke(chaincode_name=chaincode_name, function="invoke",
                             args=["a", "b", "1"])
    assert res["result"]["status"] == "OK"
    transaction_uuid = res["result"]["message"]
    print("Transaction id = {0}".format(transaction_uuid))

    # TODO: sleep 3 seconds till invoke done.
    print("Wait 5 seconds to make sure invoke is done.")
    time.sleep(5)

    print(">>>Check the after value: a, b")
    values = query_value(chaincode_name, ["a", "b"])
    print(values)
    assert values == ['9999', '20001']
    time.sleep(5)

    print(">>>Test: Check the transaction content")
    res = c.transaction_get(transaction_uuid)
    # res["chaincodeID"] = base64.b64decode(res["chaincodeID"])
    print(json.dumps(res, sort_keys=True, indent=4))
    assert res["uuid"] == transaction_uuid

    print(">>>Test: list the peers")
    res = c.peer_list()
    print(json.dumps(res, sort_keys=True, indent=4))
    assert len(res['peers']) > 0

    print(">>>Test: list the chain")
    res = c.chain_list()
    print(json.dumps(res, sort_keys=True, indent=4))
    assert res['height'] > 0
    print("Existing block number = {0}".format(res["height"]))

    print(">>>Test: get the content of block 1")
    res = c.block_get(block='1')
    print(json.dumps(res, sort_keys=True, indent=4))

    print(">>>Test: get the content of block 2")
    res = c.block_get(block='2')
    print(json.dumps(res, sort_keys=True, indent=4))
