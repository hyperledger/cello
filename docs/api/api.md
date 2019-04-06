Cello API Engine Service
========================

    This is swagger docs for Cello API engine.


**Version:** v1

### Security
---
**JWT**

|apiKey|*API Key*|
|---|---|
|In|header|
|Name|Authorization|

### /agents
---
##### ***GET***
**Summary:** List Agents

**Description:** Filter agents with query parameters.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| status | query | Status of agent | No | string |
| name | query | Agent name, can be generated automatically. | No | string |
| type | query | Type of agent | No | string |
| page | query | Page of filter | No | integer |
| per_page | query | Per Page of filter | No | integer |
| organization | query | Organization of agent | No | string (uuid) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [AgentListResponse](#agentlistresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Create Agent

**Description:** Create new agent

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| name | formData | Agent name, can be generated automatically. | No | string |
| worker_api | formData | Worker api of agent | No | string |
| capacity | formData | Capacity of agent | Yes | integer |
| node_capacity | formData | Capacity of node | Yes | integer |
| log_level | formData | Log level of agent | No | string |
| type | formData | Type of agent | Yes | string |
| schedulable | formData | Whether agent can be scheduled | No | boolean |
| k8s_config_file | formData | Kubernetes config file | No | file |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [AgentID](#agentid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /agents/organization
---
##### ***POST***
**Summary:** Apply Agent

**Description:** Apply Agent

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [AgentApply](#agentapply) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [AgentID](#agentid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /agents/{id}
---
##### ***GET***
**Summary:** Retrieve agent

**Description:** Retrieve agent

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [AgentInfo](#agentinfo) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***PUT***
**Summary:** Update Agent

**Description:** Update special agent with id.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| data | body |  | Yes | [AgentUpdateBody](#agentupdatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***PATCH***
**Summary:** Partial Update Agent

**Description:** Partial update special agent with id.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| data | body |  | Yes | [AgentPatchBody](#agentpatchbody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***DELETE***
**Summary:** Delete Agent

**Description:** Delete agent

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 204 | No Content |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 404 | Not Found |  |
| 500 | Internal Error |  |

### /agents/{id}/organization
---
##### ***DELETE***
**Summary:** Release Agent

**Description:** Release Agent

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 204 | No Content |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /auth/login/
---
##### ***POST***
**Description:** Check the credentials and return the REST Token
if the credentials are valid and authenticated.
Calls Django Auth login method to register User ID
in Django session framework

Accept the following POST parameters: username, password
Return the REST Framework Token Object's key.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [Login](#login) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [Login](#login) |

### /auth/logout/
---
##### ***GET***
**Summary:** Calls Django logout method and delete the Token object
assigned to the current User object.

**Description:** Accepts/Returns nothing.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 |  |

##### ***POST***
**Summary:** Calls Django logout method and delete the Token object
assigned to the current User object.

**Description:** Accepts/Returns nothing.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |

### /auth/password/change/
---
##### ***POST***
**Summary:** Calls Django Auth SetPasswordForm save method.

**Description:** Accepts the following POST parameters: new_password1, new_password2
Returns the success/fail message.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [PasswordChange](#passwordchange) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [PasswordChange](#passwordchange) |

### /auth/password/reset/
---
##### ***POST***
**Summary:** Calls Django Auth PasswordResetForm save method.

**Description:** Accepts the following POST parameters: email
Returns the success/fail message.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [PasswordReset](#passwordreset) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [PasswordReset](#passwordreset) |

### /auth/password/reset/confirm/
---
##### ***POST***
**Summary:** Password reset e-mail link is confirmed, therefore
this resets the user's password.

**Description:** Accepts the following POST parameters: token, uid,
    new_password1, new_password2
Returns the success/fail message.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [PasswordResetConfirm](#passwordresetconfirm) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [PasswordResetConfirm](#passwordresetconfirm) |

### /auth/user/
---
##### ***GET***
**Summary:** Reads and updates UserModel fields
Accepts GET, PUT, PATCH methods.

**Description:** Default accepted fields: username, first_name, last_name
Default display fields: pk, username, email, first_name, last_name
Read-only fields: pk, email

Returns UserModel fields.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [UserDetails](#userdetails) |

##### ***PUT***
**Summary:** Reads and updates UserModel fields
Accepts GET, PUT, PATCH methods.

**Description:** Default accepted fields: username, first_name, last_name
Default display fields: pk, username, email, first_name, last_name
Read-only fields: pk, email

Returns UserModel fields.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [UserDetails](#userdetails) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [UserDetails](#userdetails) |

##### ***PATCH***
**Summary:** Reads and updates UserModel fields
Accepts GET, PUT, PATCH methods.

**Description:** Default accepted fields: username, first_name, last_name
Default display fields: pk, username, email, first_name, last_name
Read-only fields: pk, email

Returns UserModel fields.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [UserDetails](#userdetails) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [UserDetails](#userdetails) |

### /networks
---
##### ***GET***
**Summary:** List Networks

**Description:** Filter networks with query parameters.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| page | query | Page of filter | No | integer |
| per_page | query | Per Page of filter | No | integer |
| status | query |          Network Status:             stopped                          running                          error              | No | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [NetworkListResponse](#networklistresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** New Network

**Description:** Create new network through internal nodes,
or import exists network outside

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [NetworkCreateBody](#networkcreatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [NetworkID](#networkid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /networks/{id}
---
##### ***GET***
**Summary:** Get Network

**Description:** Get network information

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /networks/{id}/peers
---
##### ***GET***
**Summary:** Get Peers

**Description:** Get peers of network.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [NetworkMemberResponse](#networkmemberresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Add New Peer

**Description:** Add peer into network

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [NetworkMemberResponse](#networkmemberresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /networks/{id}/peers/{peer_id}
---
##### ***DELETE***
**Summary:** Delete Peer

**Description:** Delete peer in network

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| peer_id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [NetworkMemberResponse](#networkmemberresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /nodes
---
##### ***GET***
**Summary:** List Nodes

**Description:** Filter nodes with query parameters.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| page | query | Page of filter | No | integer |
| per_page | query | Per Page of filter | No | integer |
| type | query |      Node type defined for network.     Fabric available types: ['ca', 'orderer', 'peer']      | No | string |
| name | query | Node name | No | string |
| network_type | query | Network type of node | No | string |
| network_version | query |      Version of network for node.     Fabric supported versions: ['1.4', '1.5']      | No | string |
| agent_id | query | Agent ID, only operator can use this field | No | string (uuid) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [NodeList](#nodelist) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Create Node

**Description:** Create node

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [NodeCreateBody](#nodecreatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [NodeID](#nodeid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /nodes/{id}
---
##### ***DELETE***
**Summary:** Delete Node

**Description:** Delete node

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 204 | No Content |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /nodes/{id}/operations
---
##### ***POST***
**Summary:** Operate Node

**Description:** Do some operation on node, start/stop/restart

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| action | query |          Operation for node:             start                          stop                          restart              | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /organizations
---
##### ***GET***
**Summary:** List Organizations

**Description:** List organizations through query parameter

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| page | query | Page of filter | No | integer |
| per_page | query | Per Page of filter | No | integer |
| name | query | Name of organization | No | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [OrganizationList](#organizationlist) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Create Organization

**Description:** Create Organization

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [OrganizationCreateBody](#organizationcreatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [OrganizationID](#organizationid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /organizations/{id}
---
##### ***GET***
**Summary:** Retrieve Organization

**Description:** Retrieve Organization

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [OrganizationResponse](#organizationresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***DELETE***
**Summary:** Delete Organization

**Description:** Delete Organization

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 204 | No Content |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /organizations/{id}/certificates
---
##### ***POST***
**Summary:** Request Certificate

**Description:** Request certificate

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /organizations/{id}/users
---
##### ***GET***
**Summary:** List users

**Description:** List users in Organization

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| username | query | Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. | Yes | string |
| page | query | Page of filter | No | integer |
| per_page | query | Per Page of filter | No | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [UserList](#userlist) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Add User

**Description:** Add user into Organization

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| data | body |  | Yes | [UserID](#userid) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /organizations/{id}/users/{user_id}
---
##### ***DELETE***
**Summary:** Remove user from Organization

**Description:** Remove user from Organization

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| user_id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 204 | No Content |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /users
---
##### ***GET***
**Summary:** List Users

**Description:** List user through query parameter

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Create User

**Description:** Create new user

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [UserCreateBody](#usercreatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [UserID](#userid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /users/{id}
---
##### ***DELETE***
**Summary:** Delete User

**Description:** Delete user

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 204 | No Content |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /users/{id}/attributes
---
##### ***GET***
**Summary:** Get User Attributes

**Description:** Get attributes of user

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 |  |

##### ***POST***
**Summary:** Create Attributes

**Description:** Create attribute for user

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |

##### ***PUT***
**Summary:** Update Attribute

**Description:** Update attribute of user

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 |  |

##### ***DELETE***
**Summary:** Delete Attribute

**Description:** Delete attribute of user

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 |  |

### /users/{id}/password
---
##### ***POST***
**Summary:** Update/Reset Password

**Description:** Update/Reset password for user

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### Models
---

### AgentResponse

Agents data

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of Agent | Yes |
| name | string | Agent name, can be generated automatically. | Yes |
| worker_api | string | Worker api of agent | Yes |
| capacity | integer | Capacity of agent | Yes |
| node_capacity | integer | Capacity of node | Yes |
| status | string | Status of agent | Yes |
| created_at | dateTime | Create time of agent | Yes |
| log_level | string | Log level of agent | Yes |
| type | string | Type of agent | Yes |
| schedulable | boolean | Whether agent can be scheduled | Yes |
| organization_id | string (uuid) | Organization ID | No |

### AgentListResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| total | integer | Total number of data | Yes |
| data | [ [AgentResponse](#agentresponse) ] | Agents data | Yes |

### BadResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| code | integer |
        Error Codes:

            20000: Unknown Error.

            20001: Validation parameter error.

            20002: Parse error.

            20003: Resource is inuse.

            20004: Resource already exists.

            20005: Request Resource Not found.

            20006: Permission Error.

            20007: Custom Error.

            20008: Have no available resource.
             | Yes |
| detail | string | Error Messages | No |

### AgentID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of Agent | Yes |

### AgentApply

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| type | string | Type of agent | Yes |
| capacity | integer | Capacity of agent | Yes |

### K8SParameter

Config of agent which is for kubernetes

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| credential_type | string | Credential type of k8s | Yes |
| enable_ssl | boolean | Whether enable ssl for api | Yes |
| ssl_ca | string | Ca file content for ssl | No |
| nfs_server | string | NFS server address for k8s | No |
| parameters | object | Extra parameters | No |
| cert | string | Cert content for k8s | No |
| key | string | Key content for k8s | No |
| username | string | Username for k8s credential | No |
| password | string | Password for k8s credential | No |

### AgentInfo

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of Agent | Yes |
| name | string | Agent name, can be generated automatically. | Yes |
| worker_api | string | Worker api of agent | Yes |
| capacity | integer | Capacity of agent | Yes |
| node_capacity | integer | Capacity of node | Yes |
| status | string | Status of agent | Yes |
| created_at | dateTime | Create time of agent | Yes |
| log_level | string | Log level of agent | Yes |
| type | string | Type of agent | Yes |
| schedulable | boolean | Whether agent can be scheduled | Yes |
| k8s_config | [K8SParameter](#k8sparameter) |  | No |
| organization_id | string (uuid) | Organization ID | No |

### AgentUpdateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Name of Agent | No |
| capacity | integer | Capacity of Agent | No |
| log_level | string |
        Log levels:
            0: Info

            1: Warning

            2: Debug

            3: Error

            4: Critical
             | No |
| status | string |

            0: Stopped

            1: Running

            2: Error
             | No |

### AgentPatchBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Name of Agent | No |
| capacity | integer | Capacity of Agent | No |
| log_level | string |
        Log levels:
            0: Info

            1: Warning

            2: Debug

            3: Error

            4: Critical
             | No |

### Login

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| username | string |  | No |
| email | string (email) |  | No |
| password | string |  | Yes |

### PasswordChange

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| new_password1 | string |  | Yes |
| new_password2 | string |  | Yes |

### PasswordReset

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| email | string (email) |  | Yes |

### PasswordResetConfirm

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| new_password1 | string |  | Yes |
| new_password2 | string |  | Yes |
| uid | string |  | Yes |
| token | string |  | Yes |

### UserDetails

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| pk | string (uuid) | ID of user | No |
| username | string | Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. | Yes |
| email | string (email) |  | No |
| first_name | string |  | No |
| last_name | string |  | No |

### NetworkResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string | Network ID | Yes |
| status | string |
        Network Status:
            stopped

            running

            error
             | Yes |
| created_at | dateTime | Network create time | Yes |
| updated_at | dateTime | Network update time | Yes |

### NetworkListResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| total | integer | Total number of networks | Yes |
| data | [ [NetworkResponse](#networkresponse) ] |  | Yes |

### NetworkCreateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| create_type | string |
        Network Create Types:
            new

            import
             | Yes |

### NetworkID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string | Network ID | Yes |

### NetworkMember

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string | Network member id | Yes |
| type | string |
        Node Types:
            ca

            orderer

            peer
             | Yes |
| url | string | URL of member | Yes |

### NetworkMemberResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| data | [ [NetworkMember](#networkmember) ] |  | Yes |

### NodeInList

Nodes list

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of node | Yes |
| type | string |
    Node type defined for network.
    Fabric available types: ['ca', 'orderer', 'peer']
     | Yes |
| name | string | Node name | No |
| network_type | string | Network type of node | No |
| network_version | string |
    Version of network for node.
    Fabric supported versions: ['1.4', '1.5']
     | No |
| created_at | dateTime | Create time of network | Yes |
| agent_id | string (uuid) | Agent ID | No |
| network_id | string (uuid) | Network ID | No |

### NodeList

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| data | [ [NodeInList](#nodeinlist) ] | Nodes list | Yes |
| total | integer | Total number of node | Yes |

### NodeCreateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| network_type | string | Network type of node | Yes |
| network_version | string |
    Version of network for node.
    Fabric supported versions: ['1.4', '1.5']
     | Yes |
| type | string |
    Node type defined for network.
    Fabric available types: ['ca', 'orderer', 'peer']
     | Yes |
| agent_type | string | Agent type | No |
| agent | string (uuid) | Agent of node | No |

### NodeID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of node | Yes |

### OrganizationResponse

Organizations list

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of Organization | Yes |
| name | string | Name of organization | Yes |
| created_at | dateTime |  | Yes |

### OrganizationList

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| total | integer | Total number of Organizations | No |
| data | [ [OrganizationResponse](#organizationresponse) ] | Organizations list | Yes |

### OrganizationCreateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Name of organization | Yes |

### OrganizationID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of Organization | Yes |

### UserInfo

Users list

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of user | Yes |
| username | string | Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. | Yes |
| role | string |  | No |

### UserList

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| total | integer | Total number of users | Yes |
| data | [ [UserInfo](#userinfo) ] | Users list | Yes |

### UserID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) | ID of user | Yes |

### UserCreateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| username | string | Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. | Yes |
| role | string |
        User roles:
            administrator

            operator

            user
             | Yes |
| organization | string (uuid) |  | No |
| password | string |  | Yes |
| email | string (email) |  | Yes |
