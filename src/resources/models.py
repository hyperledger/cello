import sys
import os
import datetime
from mongoengine import Document, StringField,\
    BooleanField, DateTimeField, IntField

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

ADMIN = 0
OPERATOR = 1
COMMON_USER = 2


class User(Document):
    username = StringField(unique=True)
    password = StringField(default=True)
    active = BooleanField(default=True)
    isAdmin = BooleanField(default=False)
    role = IntField(default=COMMON_USER)
    timestamp = DateTimeField(default=datetime.datetime.now)
    balance = IntField(default=0)
