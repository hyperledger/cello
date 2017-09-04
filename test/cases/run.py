
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import sys
import unittest
from test_user_management import UserManagementTestCase
from test_user_profile import UserProfileTest
from test_host_create import HostCreateTest


def suite():
    suit = unittest.TestSuite()
    suit.addTest(unittest.makeSuite(UserManagementTestCase))
    suit.addTest(unittest.makeSuite(UserProfileTest))
    suit.addTest(unittest.makeSuite(HostCreateTest))

    return suit


def run():
    result = unittest.TextTestRunner(verbosity=2).run(suite())


if __name__ == '__main__':
    run()
