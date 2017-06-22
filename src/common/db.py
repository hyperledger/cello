
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import os

from pymongo import MongoClient

MONGO_URL = os.environ.get('MONGO_URL', None) or 'mongodb://mongo:27017'
MONGO_DB = os.environ.get('MONGO_DB', None) or 'dev'

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[MONGO_DB]

col_host = db["host"]
# col_cluster_active = db["cluster_active"]
# col_cluster_released = db["cluster_released"]
