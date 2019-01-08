Cello API Engine Service
========================

    This is swagger docs for Cello API engine.


**Version:** v1

### Security
---
**Bearer**

|apiKey|*API Key*|
|---|---|
|In|header|
|Name|Authorization|

### /hosts
---
##### ***GET***
**Summary:** List Hosts

**Description:** Filter hosts with query parameters.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| page | query | Page of filter | No | integer |
| per_page | query | Per Page of filter | No | integer |
| status | query |                       0: Stopped                          1: Running                          2: Error              | No | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [HostListResponse](#hostlistresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Create Host

**Description:** Create new host

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | Yes | [HostCreateBody](#hostcreatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [HostID](#hostid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /hosts/{id}
---
##### ***PUT***
**Summary:** Update Host

**Description:** Update special host with id.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| data | body |  | Yes | [HostUpdateBody](#hostupdatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***PATCH***
**Summary:** Partial Update Host

**Description:** Partial update special host with id.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| data | body |  | Yes | [HostPatchBody](#hostpatchbody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***DELETE***
**Summary:** Delete Host

**Description:** Delete host

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
| status | query |                       0: Stopped                          1: Running                          2: Error              | No | string |

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

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 | Created |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /networks/{id}/channels
---
##### ***POST***
**Summary:** Create Channel

**Description:** Create new channel in network

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| data | body |  | Yes | [ChannelCreateBody](#channelcreatebody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  | [ChannelID](#channelid) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /networks/{id}/channels/{channel_id}
---
##### ***PUT***
**Summary:** Update Channel

**Description:** Update channel in network

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| channel_id | path |  | Yes | string |
| id | path |  | Yes | string |
| data | body |  | Yes | [ChannelBody](#channelbody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /networks/{id}/channels/{channel_id}/members
---
##### ***GET***
**Description:** Get members of channel

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| channel_id | path |  | Yes | string |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Description:** Join peer node into channel

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| channel_id | path |  | Yes | string |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 |  |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***DELETE***
**Description:** Remove peer from channel

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| channel_id | path |  | Yes | string |
| id | path |  | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 204 |  |  |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

### /networks/{id}/members
---
##### ***GET***
**Summary:** Get Consortium Members

**Description:** Get consortium members of network.

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

### /networks/{id}/operations
---
##### ***POST***
**Summary:** Operate Network

**Description:** Operate on network

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | string |
| data | body |  | Yes | [NetworkOperationBody](#networkoperationbody) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 202 | Accepted |  |
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

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [NetworkListResponse](#networklistresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
| 403 | Authentication credentials were not provided. |  |
| 500 | Internal Error |  |

##### ***POST***
**Summary:** Create Node

**Description:** Create new node

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

### Models
---

### HostResponse

Hosts data

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string | ID of Host | Yes |
| name | string | Name of Host | Yes |
| worker_api | string | API address of worker | Yes |
| capacity | integer | Capacity of Host | Yes |
| log_level | string |
        Log levels:
            0: Info

            1: Warning

            2: Debug

            3: Error
             | Yes |
| type | string |
        Host types:
            0: Docker

            1: Kubernetes
             | Yes |
| status | string |

            0: Stopped

            1: Running

            2: Error
             | Yes |
| created_at | dateTime | Create time | Yes |
| schedulable | boolean | Whether hos can be schedulable | Yes |

### HostListResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| total | integer | Total number of data | Yes |
| data | [ [HostResponse](#hostresponse) ] | Hosts data | Yes |

### BadResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| code | integer |
        Error Codes:

            20000: Unknown Error

            20001: Validation parameter error

            20002: Parse error

            20003: Resource is inuse
             | Yes |
| detail | string | Error Messages | No |

### HostCreateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Name of Host | Yes |
| worker_api | string | API address of worker | Yes |
| capacity | integer | Capacity of Host | Yes |
| log_level | string |
        Log levels:
            0: Info

            1: Warning

            2: Debug

            3: Error
             | Yes |
| type | string |
        Host types:
            0: Docker

            1: Kubernetes
             | Yes |

### HostID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string | ID of Host | Yes |

### HostUpdateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Name of Host | No |
| capacity | integer | Capacity of Host | No |
| log_level | string |
        Log levels:
            0: Info

            1: Warning

            2: Debug

            3: Error
             | No |
| status | string |

            0: Stopped

            1: Running

            2: Error
             | No |

### HostPatchBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Name of Host | No |
| capacity | integer | Capacity of Host | No |
| log_level | string |
        Log levels:
            0: Info

            1: Warning

            2: Debug

            3: Error
             | No |

### NetworkResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| status | string |

            0: Stopped

            1: Running

            2: Error
             | Yes |

### NetworkListResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| total | integer | Total number of networks | Yes |
| data | [ [NetworkResponse](#networkresponse) ] |  | Yes |

### ChannelCreateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Channel Name | Yes |
| type | string |
        Channel Types:
            system

            normal
             | Yes |

### ChannelID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string | Channel ID | Yes |

### ChannelBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string | Channel Name | Yes |

### NetworkOperationBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| action | string |
        Network Operations:
            join

            leave
             | Yes |
| nodes | [ string ] | Nodes ID values | Yes |

### NodeCreateBody

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| network_type | string |
        Network types:
            fabric1.3

            fabric1.4
             | Yes |
| type | string |
        Node Types:
            ca

            orderer

            peer
             | Yes |

### NodeID

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string | ID of node | Yes |
