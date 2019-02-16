import requests
import json
import os
import logging

KEYCLOAK_SERVER = os.environ.get("KEYCLOAK_SERVER", "keycloak")
KEYCLOAK_ADMIN_NAME = os.environ.get("KEYCLOAK_ADMIN_NAME", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.environ.get("KEYCLOAK_ADMIN_PASSWORD", "pass")
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "cello-realm")

LOG = logging.getLogger(__name__)


class KeyCloakClient(object):
    def __init__(
        self,
        admin_name=KEYCLOAK_ADMIN_NAME,
        admin_password=KEYCLOAK_ADMIN_PASSWORD,
        realm=KEYCLOAK_REALM,
    ):
        self._admin_name = admin_name
        self._admin_password = admin_password
        self._realm = realm
        self._base_url = "http://%s:8080" % KEYCLOAK_SERVER
        self._token_url = (
            "%s/auth/realms/master/protocol/openid-connect/token"
            % self._base_url
        )
        self._clients_url = "%s/auth/admin/realms/%s/clients" % (
            self._base_url,
            self._realm,
        )
        self._user_count_url = "%s/auth/admin/realms/%s/users/count" % (
            self._base_url,
            self._realm,
        )
        self._users_url = "%s/auth/admin/realms/%s/users" % (
            self._base_url,
            self._realm,
        )
        self._client_scopes_url = "%s/auth/admin/realms/%s/client-scopes" % (
            self._base_url,
            self._realm,
        )
        self._get_token()

    def _get_token(self):
        body = {
            "client_id": "admin-cli",
            "username": self._admin_name,
            "password": self._admin_password,
            "grant_type": "password",
        }
        ret = requests.post(self._token_url, data=body)

        token = ret.json().get("access_token", "")

        self._headers = {
            "Authorization": "bearer %s" % token,
            "Content-Type": "application/json",
        }

    def get_user_count(self):
        ret = requests.get(self._user_count_url, headers=self._headers)
        return ret.json()

    def list_users(self):
        ret = requests.get(self._users_url, headers=self._headers)

        return ret.json()

    def get_user(self, username=""):
        params = {"username": username}
        ret = requests.get(
            self._users_url, headers=self._headers, params=params
        )
        user = None
        users = ret.json()
        if len(users):
            user = users[0] if users[0].get("username") == username else None

        return user

    def get_user_id(self, username=""):
        params = {"username": username}
        ret = requests.get(
            self._users_url, headers=self._headers, params=params
        )
        users = ret.json()
        if len(users):
            return users[0].get("id", "")

        return None

    def update_user(self, user_id="", body=None):
        if body is None:
            body = {}

        requests.put(
            "%s/%s" % (self._users_url, user_id),
            data=json.dumps(body),
            headers=self._headers,
        )

    def reset_user_password(self, user_id="", password=""):
        body = {"type": "password", "temporary": False, "value": password}
        requests.put(
            "%s/%s/reset-password" % (self._users_url, user_id),
            data=json.dumps(body),
            headers=self._headers,
        )

    def _get_client_id(self, name):
        params = {"clientId": name}
        ret = requests.get(
            self._clients_url, params=params, headers=self._headers
        )
        client = ret.json()[0]
        return client.get("id", "")

    def get_client(self, name=""):
        client_id = self._get_client_id(name)
        ret = requests.get(
            "%s/%s" % (self._clients_url, client_id), headers=self._headers
        )
        client_json = ret.json()
        # protocol_mappers = client_json.get("protocolMappers", [])

        return client_json

    def update_client(self, name="", body=None):
        if body is None:
            body = {}
        client_id = self._get_client_id(name)
        # update_url = "%s/%s" % (self._clients_url, client_id)

        requests.put(
            "%s/%s" % (self._clients_url, client_id),
            data=json.dumps(body),
            headers=self._headers,
        )

    def create_new_client_scopes(self, body=None):
        if body is None:
            body = {}

        requests.post(
            self._client_scopes_url,
            data=json.dumps(body),
            headers=self._headers,
        )

    def create_user(self, body=None):
        if body is None:
            body = {}

        requests.post(
            self._users_url, data=json.dumps(body), headers=self._headers
        )

    def delete_user(self, user_id=None):
        if user_id is None:
            return False

        requests.delete(
            "%s/%s" % (self._users_url, user_id), headers=self._headers
        )

    def get_client_scopes(self):
        requests.get(self._client_scopes_url, headers=self._headers)

    def create_new_client(self, name="", url="", default_client_scopes=None):
        if default_client_scopes is None:
            default_client_scopes = []

        body = {
            "clientId": name,
            "name": name,
            "authorizationServicesEnabled": True,
            "enabled": True,
            "redirectUris": [url],
            "serviceAccountsEnabled": True,
            "defaultClientScopes": default_client_scopes,
        }
        requests.post(
            self._clients_url, data=json.dumps(body), headers=self._headers
        )
        query_params = {"clientId": name}
        ret = requests.get(
            self._clients_url, params=query_params, headers=self._headers
        )
        client_cello = ret.json()[0]

        client_id = client_cello.get("id", "")

        ret = requests.get(
            "%s/%s/client-secret" % (self._clients_url, client_id),
            headers=self._headers,
        )
        data = ret.json()
        secret = data.get("value", "")
        return secret

    def get_realm(self, name=""):
        ret = requests.get(
            "%s/auth/admin/realms/%s" % (self._base_url, name),
            headers=self._headers,
        )
        return ret.json()

    def update_realm(self, name="", body=None):
        if body is None:
            body = {}

        requests.put(
            "%s/auth/admin/realms/%s" % (self._base_url, name),
            data=json.dumps(body),
            headers=self._headers,
        )

    def create_realm(self, body=None):
        if body is None:
            return False

        requests.post(
            "%s/auth/admin/realms/" % self._base_url,
            headers=self._headers,
            data=json.dumps(body),
        )
