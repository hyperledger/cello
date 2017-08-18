
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, fields, marshal_with
from flask_login import login_required
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from resources.models import User as UserModel

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_delete_fields = {
    "status": fields.String
}


class DeleteUser(Resource):
    @login_required
    @marshal_with(user_delete_fields)
    def delete(self, user_id):
        try:
            user = UserModel.objects.get(id=user_id)
        except Exception:
            pass
        else:
            user.delete()

        return {"status": "OK"}, 200
