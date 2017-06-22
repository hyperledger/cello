# API V1

**Deprecated.**

## Front
These APIs will be called by front web services.

Latest version please see [restserver.yaml](restserver.yaml).

### cluster_apply

Find an available cluster in the pool for a user.

```
GET /v1/cluster_apply?user_id=xxx&consensus_plugin=pbft&consensus_mode
=classic&size=4&new=0
```

if add `new=1`, then ignore matched clusters that user already occupy.

When `cluster_apply` request arrives, the server will try checking  available cluster in the pool.

Accordingly, the server will return a json response (succeed or fail).

### cluster_release

Declare the id to release a cluster.

```
GET /v1/cluster_release?cluster_id=xxxxxxxx
```

Rlease all clusters under a user account.
```
GET /v1/cluster_release?user_id=xxxxxxxx
```
The server will drop the corresponding cluster, recreate it and put into available pool for future requests.

## Admin
Those APIs should not be called by outside applications. Just for
information, please see [api-admin.yaml](api-admin.yaml)

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.