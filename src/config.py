
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import os

SERVER_PUBLIC_IP = os.environ.get("SERVER_PUBLIC_IP")
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM")
KEYCLOAK_SERVER_PORT = os.environ.get("KEYCLOAK_SERVER_PORT")


class Config(object):
    DEBUG = False
    SECRET_KEY = '?\xbf,\xb4\x8d\xa3"<\x9c\xb0@\x0f5\xab,w\xee\x8d$0\x13\x8b83'
    OIDC_CLIENT_SECRETS = './client_secrets.json'
    OIDC_ID_TOKEN_COOKIE_SECURE = False
    OIDC_REQUIRE_VERIFIED_EMAIL = False
    OIDC_OPENID_REALM = 'http://%s:8080/oidc_callback' % SERVER_PUBLIC_IP
    OIDC_VALID_ISSUERS = 'http://%s:%s/auth/realms/%s' % (SERVER_PUBLIC_IP,
                                                          KEYCLOAK_SERVER_PORT,
                                                          KEYCLOAK_REALM)


class ProductionConfig(Config):
    DEBUG = False


class DevelopmentConfig(Config):
    DEBUG = True
    MONGODB_HOST = os.getenv('MONGODB_HOST', 'mongo')
    MONGODB_DB = os.getenv('MONGODB_DB', 'dev')
    MONGODB_PORT = int(os.getenv('MONGODB_PORT', 27017))
    MONGODB_USERNAME = os.getenv('MONGODB_USERNAME', '')
    MONGODB_PASSWORD = os.getenv('MONGODB_PASSWORD', '')
    SALT = '$2b$12$e9UeM1mU0RahYaC4Ikn1Ce'
