## Master Node Setup
In order to meet the requirement of production, the new version of master node contain the following services:
- `nginx`: Entry point of services.
- `api-engine`: Web service that provides APIs for the user to interact with Cello.
- `api-engine-tasks`: Service to handle async tasks like the creation of node, network, etc.
- `redis`: Message queue service to conduct async tasks
- `postgres`: Data persistence service

### System Requirment
- Docker engine: 18.0+
- Docker-compose: 1.18+

### Setup
- Build images locally
``` bash
$ cd cello
$ make docker
```
- Start services
``` bash
$ make start-next
```

### Usage
After `make start-next` command was run, nginx should now listening on "8085" port.

Visit `http://$SERVICE_IP:8085/engine/docs` to the browser and use the APIs, where `SERVICE_IP` is the IP address of the host.

The design of the new APIs is based on the [New Governing Model](https://docs.google.com/document/d/1Dw6cEKaul6FenORNkDcxvPDDKwpl0A5EmcJBlqAWJoU/edit#), please check the document for more details.

---
#### Login
Due to the policy of role-based access control, the user need to provide authorization message while calling APIs.

Use `http://$SERVICE_IP:8085/engine/auth/login` to fetch authorization token (JWT format)

**Example**
Login as "admin":
```bash
$ curl -X POST "http://127.0.0.1:8085/engine/auth/login/" -H  "accept: application/json"  -H  "Content-Type: application/json" -d "{  \"username\": \"admin\",  \"password\": \"pass\"}"
```
Output:
```
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZWRmNWI5OTQtMjgzMS00OGE0LWJiMzQtYWQzYWJkOTNlOGY1IiwidXNlcm5hbWUiOiJsdWtlIiwiZXhwIjoxNTUzODUwMDY2LCJlbWFpbCI6Imx1a2VAZXhhbXBsZS5jb20ifQ.2NLbeQh_45vEIPysJKJBPuICwOqpHTjsGRBYBQnFMNE",
  "user": {
    "pk": "edf5b994-2831-48a4-bb34-ad3abd93e8f5",
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "",
    "last_name": ""
  }
}
```
---
#### Create Agent
Use `http://$SERVICE_IP:8085/engine/agent` to create an agent

**Example**
Create docker type agent called "Testing":
```bash
$ curl -X POST "http://127.0.0.1:8085/engine/agents" -H  "accept: application/json" -H  "Authorization: JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZWRmNWI5OTQtMjgzMS00OGE0LWJiMzQtYWQzYWJkOTNlOGY1IiwidXNlcm5hbWUiOiJsdWtlIiwiZXhwIjoxNTUzODUwMDY2LCJlbWFpbCI6Imx1a2VAZXhhbXBsZS5jb20ifQ.2NLbeQh_45vEIPysJKJBPuICwOqpHTjsGRBYBQnFMNE" -H  "Content-Type: application/json" -d "{  \"name\": \"Testing\",  \"worker_api\": \"tcp://127.0.0.1:2375\",  \"capacity\": 4,  \"node_capacity\": 4,  \"log_level\": \"info\",  \"type\": \"docker\",  \"schedulable\": true  }"
```

Output：
```
{
  "id": "c9d1ed29-94ff-4703-8c5b-201767bb1f4c"
}
```
Note: `Authorization` field is added to the header, which value is "JWT" + " " + token return from the login.

---
#### Create Organization
Use `http://$SERVICE_IP:8085/engine/organizations` to create an organization

**Example**
Create an organization named "org1":
```bash
$ curl -X POST "http://127.0.0.1:8085/engine/organizations" -H  "accept: application/json" -H  "Authorization: JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZWRmNWI5OTQtMjgzMS00OGE0LWJiMzQtYWQzYWJkOTNlOGY1IiwidXNlcm5hbWUiOiJsdWtlIiwiZXhwIjoxNTUzODUwMDY2LCJlbWFpbCI6Imx1a2VAZXhhbXBsZS5jb20ifQ.2NLbeQh_45vEIPysJKJBPuICwOqpHTjsGRBYBQnFMNE" -H  "Content-Type: application/json" -d "{  \"name\": \"org1\"}"
```

Output:
```
{
  "id": "6b2f387d-4fee-4585-a3c0-4608964e234a"
}
```
---
#### Create User
Use `http://$SERVICE_IP:8085/engine/user` to create an user

**Example**
Create an user named alice, which is the operator of the "org1":
```bash
$ curl -X POST "http://127.0.0.1:8085/engine/users" -H  "accept: application/json" -H  "Authorization: JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZWRmNWI5OTQtMjgzMS00OGE0LWJiMzQtYWQzYWJkOTNlOGY1IiwidXNlcm5hbWUiOiJsdWtlIiwiZXhwIjoxNTUzODUwMDY2LCJlbWFpbCI6Imx1a2VAZXhhbXBsZS5jb20ifQ.2NLbeQh_45vEIPysJKJBPuICwOqpHTjsGRBYBQnFMNE" -H  "Content-Type: application/json" -d "{  \"username\": \"alice\",  \"role\": \"operator\",  \"organization\": \"6b2f387d-4fee-4585-a3c0-4608964e234a\",  \"password\": \"pass\",  \"email\": \"alice@example.com\"}"
```

Output:
```
{
  "id": "edf5b994-2831-48a4-bb34-ad3abd93e8f5"
}
```
---
#### Apply Agent
Since the default user "admin" doesn't associate with any organization, user need switch to user like “alice” to apply an agent.

Use `http://$SERVICE_IP:8085/engine/agents/organization` to apply an agent

**Example**
Apply the "Testing" agent on behave of "org1":
```bash
curl -X POST "http://127.0.0.1:8085/engine/agents/organization" -H  "accept: application/json" -H  "Authorization: JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZWRmNWI5OTQtMjgzMS00OGE0LWJiMzQtYWQzYWJkOTNlOGY1IiwidXNlcm5hbWUiOiJsdWtlIiwiZXhwIjoxNTUzODUwMDY2LCJlbWFpbCI6Imx1a2VAZXhhbXBsZS5jb20ifQ.2NLbeQh_45vEIPysJKJBPuICwOqpHTjsGRBYBQnFMNE" -H  "Content-Type: application/json" -d "{  \"type\": \"docker\",  \"capacity\": 3}"
```

Output:
```
{
  "id": "c9d1ed29-94ff-4703-8c5b-201767bb1f4c"
}
```
Note: The JWT token has been changed for the user "alice"

---
#### Create peer node
Use `http://$SERVICE_IP:8085/engine/nodes` to create a peer node

**Example**
Create a peer node in "Testing" agent:
```bash
curl -X POST "http://127.0.0.1:8085/engine/nodes" -H  "accept: application/json" -H  "Authorization: JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZWRmNWI5OTQtMjgzMS00OGE0LWJiMzQtYWQzYWJkOTNlOGY1IiwidXNlcm5hbWUiOiJsdWtlIiwiZXhwIjoxNTUzODUwMDY2LCJlbWFpbCI6Imx1a2VAZXhhbXBsZS5jb20ifQ.2NLbeQh_45vEIPysJKJBPuICwOqpHTjsGRBYBQnFMNE" -H  "Content-Type: application/json" -d "{  \"network_type\": \"fabric\",  \"network_version\": \"1.4\",  \"type\": \"peer\",  \"agent_type\": \"docker\",  \"agent\": \"c9d1ed29-94ff-4703-8c5b-201767bb1f4c\"}"
```

Output:
```
{
  "id": "5da8ebbe-484a-4fdf-b59f-f94a2202f2a5"
}
```
