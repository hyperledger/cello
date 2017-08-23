
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, fields, marshal_with, reqparse
from flask_login import login_required
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, StringValidator
from modules.user.user import User

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class ValidationError(Exception):
    pass


def email(email_str):
    """
    Email Field to validate input email string
    :param email_str: email address
    :return: email address string or raise exception
    """
    validator = StringValidator()
    if validator.validate(email_str, ["is_email"]):
        return email_str
    else:
        raise ValidationError("{} not a valid email".format(email_str))


user_profile_fields = {
    "username": fields.String,
    "name": fields.String,
    "email": fields.String,
    "bio": fields.String,
    "url": fields.String,
    "location": fields.String
}

profile_response_fields = {
    "result": fields.Nested(user_profile_fields),
    "success": fields.Boolean,
    "error": fields.String
}

update_response_fields = {
    "success": fields.Boolean,
    "error": fields.String
}

update_profile_parser = reqparse.RequestParser()
update_profile_parser.add_argument('name',
                                   location='form',
                                   help='name for update')
update_profile_parser.add_argument('email',
                                   type=email,
                                   location='form',
                                   help='email for update')
update_profile_parser.add_argument('bio',
                                   location='form',
                                   help='bio for update')
update_profile_parser.add_argument('url',
                                   location='form',
                                   help='url for update')
update_profile_parser.add_argument('location',
                                   location='form',
                                   help='location for update')


class UserProfile(Resource):
    """
    User Profile class, supply get/put method
    """
    @marshal_with(profile_response_fields)
    def get(self, user_id):
        """
        Get user profile information
        :param user_id: user id of User to query
        :return: profile data, status code
        """
        user_obj = User()
        user = user_obj.get_by_id(user_id)
        if not user:
            return {"error": "No such User", "success": False}, 400

        data = {
            "result": {
                "username": user.username,
                "name": user.profile.name if user.profile else "",
                "email": user.profile.email if user.profile else "",
                "bio": user.profile.bio if user.profile else "",
                "url": user.profile.url if user.profile else "",
                "location": user.profile.location if user.profile else "",
            },
            "success": True
        }

        return data, 200

    @marshal_with(update_response_fields)
    def put(self, user_id):
        """
        Update user profile
        :param user_id: user id of User to update profile
        :return: api response, status code
        """
        args = update_profile_parser.parse_args()
        name, email_addr = args["name"], args["email"]
        bio, url = args["bio"], args["url"]
        location = args["location"]
        user_obj = User()
        user = user_obj.get_by_id(user_id)
        if not user:
            return {"error": "No such User", "success": False}, 400
        else:
            user.update_profile(name=name, email=email_addr,
                                bio=bio, url=url, location=location)
            return {"success": True}, 200
