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
| status | query |          Status of network:                      0: Stopped                          1: Running                          2: Error              | No | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 |  | [NetworkListResponse](#networklistresponse) |
| 400 | Bad Request |  |
| 401 | Permission denied |  |
| 500 | Internal Error |  |

### Models
---

### NetworkResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| status | string |
        Status of network:

            0: Stopped

            1: Running

            2: Error
             | Yes |

### NetworkListResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| total | integer | Total number of networks | Yes |
| data | [ [NetworkResponse](#networkresponse) ] |  | Yes |
