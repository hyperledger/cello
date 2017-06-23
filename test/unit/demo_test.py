
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import unittest

def add_one(x):
    return x + 1

class ChaincodeTest(unittest.TestCase):
    """ Test chaincode deploy, invoke and query
    """
    def setUp(self):
        self.name = b'Hello world!'

    def tearDown(self):
        pass

    def test_add_one(self):
        self.assertEqual(add_one(3), 4)

if __name__ == '__main__':
    unittest.main()
