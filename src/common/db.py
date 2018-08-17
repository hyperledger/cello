
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import os

from pymongo import MongoClient

MONGO_URL = 'mongodb://127.0.0.1:27017' #os.environ.get('MONGO_URL', None) or 'mongodb://mongo:27017'
MONGO_DB = 'dev' #os.environ.get('MONGO_DB', None) or 'dev'

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[MONGO_DB]
