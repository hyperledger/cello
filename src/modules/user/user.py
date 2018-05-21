import sys
import os
import logging
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from flask_login import UserMixin, AnonymousUserMixin
from modules.models import User as UserModel
from modules.models import LoginHistory, Profile
from common import log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class User(UserMixin):
    """
    User object that runs through the service
    """
    def __init__(self, username=None, password=None, active=True,
                 is_admin=False, role=None, id=None, balance=0):
        """
        Initialize a user object
        :param username: username of this user
        :param password: password of this user
        :param active: whether user is active
        :param is_admin: whether user is admin
        :param role: role of this user
        :param id: db id of this user
        :param balance: blue point of this user
        """
        self.username = username
        self.password = password
        self.active = active
        self.isAdmin = is_admin
        self.role = role
        self.id = None
        self.profile = None
        self.dbUser = None
        self.balance = balance

    def is_active(self):
        """
        Get whether user is active
        :return: True or False
        """
        return self.active

    def is_admin(self):
        """
        Get whether user is admin
        :return: True or False
        """
        return self.isAdmin

    @property
    def user_role(self):
        """
        Get user role
        :return: ADMIN/OPERATOR/COMMON_USER
        """
        return self.role

    def save(self):
        """
        Create new user
        :return: id of new user
        """
        new_user = UserModel(username=self.username,
                             password=self.password,
                             active=self.active,
                             role=self.role,
                             balance=self.balance,
                             isAdmin=self.isAdmin)
        new_user.save()
        self.id = str(new_user.id)
        self.dbUser = new_user
        return self.id

    def get_by_username(self, username):
        """
        Get user by username
        :param username: the name of user to query
        :return: User object
        """
        try:
            db_user = UserModel.objects.get(username=username)

            if db_user:
                self.username = db_user.username
                self.active = db_user.active
                self.password = db_user.password
                self.id = db_user.id
                self.isAdmin = db_user.isAdmin
                self.balance = db_user.balance
                self.dbUser = db_user
                self.role = db_user.role
                return self
            else:
                return None
        except Exception as exc:
            logger.error("get user exc %s", exc)
            return None

    def get_by_id(self, id):
        """
        Get user by user id
        :param id: id of user in db
        :return: User object
        """
        try:
            dbUser = UserModel.objects.get(id=id)
        except Exception:
            return None
        else:
            self.username = dbUser.username
            self.active = dbUser.active
            self.id = dbUser.id
            self.balance = dbUser.balance
            self.profile = dbUser.profile
            self.dbUser = dbUser

            return self

    def set_active(self, active):
        self.dbUser.update(set__active=active,
                           upsert=True)

    def update_password(self, password):
        try:
            self.dbUser.update(set__password=password,
                               upsert=True)
        except Exception as exc:
            logger.info("error {}".format(exc.message))

    def update_profile(self, name, email, bio, url, location):
        """
        Update user profile
        :param name: name to update
        :param email: email to update
        :param bio: bio to update
        :param url: url to update
        :param location: location to update
        """
        # if user has profile update else create new profile
        if self.profile:
            self.profile.update(set__name=name,
                                set__email=email,
                                set__bio=bio,
                                set__url=url,
                                set__location=location,
                                upsert=True)
        else:
            profile = Profile(name=name,
                              email=email,
                              bio=bio,
                              url=url,
                              location=location)
            profile.save()
            self.dbUser.profile = profile
            self.dbUser.save()


class Anonymous(AnonymousUserMixin):
    name = u"Anonymous"
