# API V2

Each url should have the `/v2` prefix, e.g., `/cluster_op` should be `/v2/cluster_op`.

## Rest Server
These APIs will be called by front web services.

Latest version please see [restserver.yaml](restserver.yaml).

### Cluster

Basic request may looks like:

```
POST /cluster_op
{
action:xxx,
key:value
}
```

Or

```
GET /cluster_op?action=xxx&key=value
```

The supported actions can be 
* `apply`: apply a chain
* `release`: release a chain, possibly only one peer
* `start`: start a chain, possibly only one peer
* `stop`: stop a chain, possibly only one peer
* `restart`: restart a chain, possibly only one peer

We may show only one of the GET or POST request in the following sections.

#### Cluster apply

Apply an available cluster for a user, support multiple filters like consensus_plugin, size.

```
POST /cluster_op
{
action:apply,
user_id:xxx,
allow_multiple:False,
consensus_plugin:pbft,
consensus_mode:batch,
size:4
}
```

if `allow_multiple:True`, then ignore matched clusters that user already occupied.

When `apply` request arrives, the server will try checking  available cluster in the pool.

Accordingly, the server will return a json response (succeed or fail).

```json
{
  "code": 200,
  "data": {
    "api_url": "http://192.168.7.62:5004",
    "consensus_mode": "batch",
    "consensus_plugin": "pbft",
    "daemon_url": "tcp://192.168.7.62:2375",
    "id": "576ba021414b0502864d0306",
    "name": "compute2_4",
    "size": 4,
    "user_id": "xxx"
  },
  "error": "",
  "status": "OK"
}
```

#### Cluster release

Release a specific cluster.

```
POST /cluster_op
{
action:release,
cluster_id:xxxxxxxx
}
```

Return json object may look like

```json
{
  "code": 200,
  "data": "",
  "error": "",
  "status": "OK"
}
```

Release all clusters under a user account.

```
POST /cluster_op
{
action:release,
user_id:xxxxxxxx
}
```

The server will drop the corresponding cluster, recreate it and put into available pool for future requests.


#### Cluster Start, Stop or Restart

Take `start` for example, you can specify the node_id if to operate one node.

```
POST /cluster_op
{
action:start,
cluster_id:xxx,
node_id:vp0
}
```

### Clusters List

Return the json object whose data may contain list of cluster ids.

List all available cluster of given type.

```
POST /clusters
{
consensus_plugin:pbft,
consensus_mode:classic,
size:4,
user_id:""
}
```

Query all cluster of given type

```
POST /clusters
{
consensus_plugin:pbft,
consensus_mode:classic,
size:4,
}
```

Query the clusters for a user.


```
POST /clusters
{
user_id:xxx
}
```

### Get object of a cluster

```
GET /cluster/xxxxxxx
```

Will return the json object whose data may contain detailed information of cluster.
