
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


class UserProfileTest(TestCase):
    """
    Running a user profile test include get/edit
    """
    def create_app(self):
        """
        Create a flask web app
        :return: flask web app object
        """
        app.config['TESTING'] = True
        app.config['LOGIN_DISABLED'] = False
        return app

    def _login(self, username, password):
        """
        Login in a user
        :param username: username for this user
        :param password: password for this user
        :return: login response
        """
        return self.client.post('/api/auth/login',
                                data=dict(
                                    username=username,
                                    password=password
                                ),
                                follow_redirects=True)

    def test_user_profile(self):
        """
        Test get/edit user profile,
        Create new user, then get profile of this user,
        use fake data to update user profile,
        then get the update response validate with new data
        :return: None
        """
        self._login("admin", "pass")

        # create a new user
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

        # get profile of new user
        response = self.client.get("/api/v2/profile/%s" % user_id)
        response = response.data.decode("utf-8")
        response = json.loads(response)
        self.assertTrue(response.get("success", False))

        # user new info to update user's profile
        name = fake.name()
        email = fake.email()
        url = fake.url()
        location = fake.address()
        bio = fake.company()

        self.client.put("/api/v2/profile/%s" % user_id, data=dict(
            name=name,
            email=email,
            url=url,
            bio=bio,
            location=location
        ))

        # get new profile info and check with origin profile info
        response = self.client.get("/api/v2/profile/%s" % user_id)
        response = response.data.decode("utf-8")
        response = json.loads(response)
        result = response.get("result", {})
        self.assertEqual(result.get("name", ""), name)
        self.assertEqual(result.get("email", ""), email)
        self.assertEqual(result.get("bio", ""), bio)
        self.assertEqual(result.get("url", ""), url)
        self.assertEqual(result.get("location", ""), location)

        self.client.delete("/api/user/delete/%s" % user_id)
