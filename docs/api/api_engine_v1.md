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

### /hosts/
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
| 500 | Internal Error |  |

### /hosts/{id}/
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
| 404 | Not Found |  |
| 500 | Internal Error |  |

### /networks/
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
| 500 | Internal Error |  |

### /nodes/
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
| 200 |  | [NetworkListResponse](#networklistresponse) |
| 400 |  | [BadResponse](#badresponse) |
| 401 | Permission denied |  |
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
             | Yes |
| message | string | Error Messages | No |

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
