import sys
import os
import logging
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from flask_login import UserMixin, AnonymousUserMixin
from resources import models
from common import log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class User(UserMixin):
    def __init__(self, username=None, password=None, active=True,
                 is_admin=False, role=None, id=None):
        self.username = username
        self.password = password
        self.active = active
        self.isAdmin = is_admin
        self.role = role
        self.id = None

    def is_active(self):
        return self.active

    def is_admin(self):
        return self.isAdmin

    def user_role(self):
        return self.role

    def save(self):
        new_user = models.User(username=self.username,
                               password=self.password,
                               active=self.active,
                               role=self.role,
                               isAdmin=self.isAdmin)
        new_user.save()
        self.id = new_user.id
        return self.id

    def get_by_username(self, username):

        dbUser = models.User.objects.get(username=username)
        if dbUser:
            self.username = dbUser.username
            self.active = dbUser.active
            self.id = dbUser.id
            return self
        else:
            return None

    def get_by_username_w_password(self, username):
        try:
            dbUser = models.User.objects.get(username=username)

            if dbUser:
                logger.info("get user")
                self.username = dbUser.username
                self.active = dbUser.active
                self.password = dbUser.password
                self.id = dbUser.id
                self.isAdmin = dbUser.isAdmin
                return self
            else:
                logger.info("not get user")
                return None
        except Exception as exc:
            logger.info("get user exc %s", exc)
            return None

    def get_by_id(self, id):
        dbUser = models.User.objects.with_id(id)
        if dbUser:
            self.username = dbUser.username
            self.active = dbUser.active
            self.id = dbUser.id

            return self
        else:
            return None


class Anonymous(AnonymousUserMixin):
    name = u"Anonymous"
