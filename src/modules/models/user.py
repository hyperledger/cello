import sys
import os
import datetime
from mongoengine import Document, StringField,\
    BooleanField, DateTimeField, IntField, \
    ReferenceField

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

ADMIN = 0
OPERATOR = 1
COMMON_USER = 2


class Profile(Document):
    """
    Profile model of User
    :member name: name of user
    :member email: email of user
    :member bio: bio of user
    :member organization: organization of user
    :member url: user's url
    :member location: user's location
    """
    name = StringField(default="")
    email = StringField(default="")
    bio = StringField(default="")
    organization = StringField(default="")
    url = StringField(default="")
    location = StringField(default="")


class User(Document):
    """
    User model
    :member username: user's username
    :member password: user's password, save encrypted password
    :member active: whether user is active
    :member isAdmin: whether user is admin
    :member role: user's role
    :member timestamp: user's create time
    :member balance: user's balance
    :member profile: user's profile
    """
    username = StringField(unique=True)
    password = StringField(default="")
    active = BooleanField(default=True)
    isAdmin = BooleanField(default=False)
    role = IntField(default=COMMON_USER)
    timestamp = DateTimeField(default=datetime.datetime.now)
    balance = IntField(default=0)
    profile = ReferenceField(Profile)


class LoginHistory(Document):
    """
    User login history
    :member time: login time
    :member user: which user object
    """
    time = DateTimeField(default=datetime.datetime.now)
    user = ReferenceField(User)
