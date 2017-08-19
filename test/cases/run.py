
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import sys
import unittest
from test_user_management import UserManagementTestCase


def suite():
    suit = unittest.TestSuite()
    suit.addTest(unittest.makeSuite(UserManagementTestCase))

    return suit


def run():
    result = unittest.TextTestRunner(verbosity=2).run(suite())


if __name__ == '__main__':
    run()
