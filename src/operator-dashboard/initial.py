import os
import subprocess

from common import KeyCloakClient

KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM")
SERVER_PUBLIC_IP = os.environ.get("SERVER_PUBLIC_IP")
OPERATOR_DASHBOARD_SSO_KEY = os.environ.get("OPERATOR_DASHBOARD_SSO_KEY")
USER_DASHBOARD_SSO_KEY = os.environ.get("USER_DASHBOARD_SSO_KEY")
OPERATOR_DEFAULT_ADMIN_NAME = os.environ.get("OPERATOR_DEFAULT_ADMIN_NAME")
OPERATOR_DEFAULT_ADMIN_PASSWORD = \
    os.environ.get("OPERATOR_DEFAULT_ADMIN_PASSWORD")

keycloak_client = KeyCloakClient()

keycloak_client.create_realm({
    "realm": KEYCLOAK_REALM,
    "sslRequired": "none",
    "enabled": True,
    "displayNameHtml": '<div class="kc-logo-text"><span>Cello</span></div>',
    "displayName": "Cello",
    "accessTokenLifespan": 86400,
    "accessTokenLifespanForImplicitFlow": 86400,
    "internationalizationEnabled": True,
    "supportedLocales": ['de', 'no', 'ru', 'sv', 'pt-BR', 'lt', 'en',
                         'it', 'fr', 'zh-CN', 'es', 'ja', 'sk', 'ca', 'nl']
})
realm = keycloak_client.get_realm(KEYCLOAK_REALM)

# Create new client scopes
client_scope_body = {
    "name": "cello-scopes",
    "description": "Cello scopes",
    "protocol": "openid-connect",
    "protocolMappers": [
        {
            "name": "role",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-attribute-mapper",
            "config": {
                "claim.name": "role",
                "jsonType.label": "String",
                "user.attribute": "role",
                "id.token.claim": True,
                "userinfo.token.claim": True,
                "access.token.claim": True
            }
        },
        {
            "name": "tenant",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-attribute-mapper",
            "config": {
                "claim.name": "tenant",
                "jsonType.label": "String",
                "user.attribute": "tenant",
                "id.token.claim": True,
                "userinfo.token.claim": True,
                "access.token.claim": True
            }
        }
    ]
}
keycloak_client.create_new_client_scopes(body=client_scope_body)

# Create new clients
clients = [
    {
        "name": OPERATOR_DASHBOARD_SSO_KEY,
        "redirectUrl": "http://%s:8080/*" % SERVER_PUBLIC_IP
    },
    {
        "name": USER_DASHBOARD_SSO_KEY,
        "redirectUrl": "http://%s:8081/*" % SERVER_PUBLIC_IP
    },
]

secrets = []
for client in clients:
    secret = keycloak_client.create_new_client(
        client.get("name", ""),
        client.get("redirectUrl"),
        ["cello-scopes", "email", "profile"])
    secrets.append(secret)

operator_dashboard_secret = secrets[0]
user_dashboard_secret = secrets[1]

command = 'sed -i "s/OPERATOR_DASHBOARD_SSO_SECRET?=' \
          '.*/OPERATOR_DASHBOARD_SSO_SECRET?=%s/g" ' \
          '/makerc/operator-dashboard' % operator_dashboard_secret
subprocess.call([command], shell=True)
command = 'sed -i "s/USER_DASHBOARD_SSO_SECRET?=' \
          '.*/USER_DASHBOARD_SSO_SECRET?=%s/g" ' \
          '/makerc/user-dashboard' % user_dashboard_secret
subprocess.call([command], shell=True)

create_user_body = {
    "username": OPERATOR_DEFAULT_ADMIN_NAME,
    "requiredActions": [],
    "enabled": True
}

keycloak_client.create_user(create_user_body)

user_id = keycloak_client.get_user_id(username=OPERATOR_DEFAULT_ADMIN_NAME)
keycloak_client.reset_user_password(user_id, OPERATOR_DEFAULT_ADMIN_PASSWORD)

keycloak_client.update_user(user_id, body={
    "attributes": {
        "role": "administrator",
    },
})
