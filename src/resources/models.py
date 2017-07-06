import sys
import os
import datetime
from mongoengine import Document, StringField,\
    BooleanField, DateTimeField

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))


class User(Document):
    username = StringField(unique=True)
    password = StringField(default=True)
    active = BooleanField(default=True)
    isAdmin = BooleanField(default=False)
    timestamp = DateTimeField(default=datetime.datetime.now())
