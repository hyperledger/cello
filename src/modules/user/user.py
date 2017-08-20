import sys
import os
import logging
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from flask_login import UserMixin, AnonymousUserMixin
from modules.models import User as UserModel
from modules.models import LoginHistory
from common import log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class User(UserMixin):
    def __init__(self, username=None, password=None, active=True,
                 is_admin=False, role=None, id=None, balance=0):
        self.username = username
        self.password = password
        self.active = active
        self.isAdmin = is_admin
        self.role = role
        self.id = None
        self.balance = balance

    def is_active(self):
        return self.active

    def is_admin(self):
        return self.isAdmin

    def user_role(self):
        return self.role

    def save(self):
        new_user = UserModel(username=self.username,
                             password=self.password,
                             active=self.active,
                             role=self.role,
                             balance=self.balance,
                             isAdmin=self.isAdmin)
        new_user.save()
        self.id = str(new_user.id)
        return self.id

    def get_by_username(self, username):

        dbUser = UserModel.objects.get(username=username)
        if dbUser:
            self.username = dbUser.username
            self.active = dbUser.active
            self.id = dbUser.id
            self.balance = dbUser.balance
            return self
        else:
            return None

    def get_by_username_w_password(self, username):
        try:
            dbUser = UserModel.objects.get(username=username)

            if dbUser:
                self.username = dbUser.username
                self.active = dbUser.active
                self.password = dbUser.password
                self.id = dbUser.id
                self.isAdmin = dbUser.isAdmin
                self.balance = dbUser.balance
                login_history = LoginHistory(user=dbUser)
                login_history.save()
                return self
            else:
                return None
        except Exception as exc:
            logger.error("get user exc %s", exc)
            return None

    def get_by_id(self, id):
        try:
            dbUser = UserModel.objects.get(id=id)
        except Exception:
            return None
        else:
            self.username = dbUser.username
            self.active = dbUser.active
            self.id = dbUser.id
            self.balance = dbUser.balance

            return self


class Anonymous(AnonymousUserMixin):
    name = u"Anonymous"
