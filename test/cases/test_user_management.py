
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import unittest
from flask_testing import TestCase
import sys
import os
import logging
import json
from faker import Factory
fake = Factory.create()

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))
from dashboard import app
from common import log_handler, LOG_LEVEL
from modules.models import COMMON_USER

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class UserManagementTestCase(TestCase):
    def create_app(self):
        app.config['TESTING'] = True
        app.config['LOGIN_DISABLED'] = False
        return app

    def _login(self, username, password):
        return self.client.post('/api/auth/login',
                                data=dict(
                                    username=username,
                                    password=password
                                ),
                                follow_redirects=True)

    def test_server_is_up_and_running(self):
        response = self.client.get("/login")
        self.assert200(response)

    def test_login_required(self):
        response = self.client.get("/")
        self.assertRedirects(response, "/login")

    def test_valid_login(self):
        response = self._login("admin", "pass")
        response = response.data.decode("utf-8")
        response = json.loads(response)
        self.assertTrue(response.get("success", False))

    def test_list_user(self):
        self._login("admin", "pass")
        raw_response = self.client.get("/api/user/list")
        response = raw_response.data.decode("utf-8")
        response = json.loads(response)
        users = response.get("users", {}).get("result", [])
        self.assertTrue(len(users) >= 1)

    def test_create_update_delete_user(self):
        self._login("admin", "pass")
        user_name = fake.user_name()
        password = fake.password()
        raw_response = self.client.post("/api/user/create",
                                        data=dict(
                                            username=user_name,
                                            password=password,
                                            active=True,
                                            role=COMMON_USER
                                        ))
        response = raw_response.data.decode("utf-8")
        response = json.loads(response)
        user_id = response.get("id", "")
        self.assertTrue(user_id != "")

        response = self._login(user_name, password)
        response = response.data.decode("utf-8")
        response = json.loads(response)
        self.assertTrue(response.get("success", False))

        self._login("admin", "pass")

        new_user_name = fake.user_name()
        response = self.client.put("/api/user/update/%s" % user_id,
                                   data=dict(
                                       username=new_user_name,
                                       active=True,
                                       role=COMMON_USER
                                   ))
        response = response.data.decode("utf-8")
        response = json.loads(response)
        self.assertEqual(response.get("status", ""), "OK")

        response = self.client.delete("/api/user/delete/%s" % user_id)
        response = response.data.decode("utf-8")
        response = json.loads(response)
        self.assertEqual(response.get("status", ""), "OK")
