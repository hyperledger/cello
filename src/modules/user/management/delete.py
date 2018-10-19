
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, fields, marshal_with
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL, KeyCloakClient
from auth import oidc

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_delete_fields = {
    "status": fields.String
}


class DeleteUser(Resource):
    @oidc.accept_token(True)
    @marshal_with(user_delete_fields)
    def delete(self, user_id):
        keycloak_client = KeyCloakClient()
        keycloak_client.delete_user(user_id)

        return {"status": "OK"}, 200
