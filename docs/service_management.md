# Service Management

Main Cello services are running in the Master Node.

## Services

After starting cello services using `make start`, there will generate several service containers as the following:

```bash
$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                                 NAMES
fdf4b8465d14        yeasy/nginx         "/bin/bash /tmp/do..."   12 seconds ago      Up 11 seconds       0.0.0.0:80->80/tcp, 0.0.0.0:8080->8080/tcp, 443/tcp   nginx
80c3962867ff        mongo:3.2           "docker-entrypoint..."   12 seconds ago      Up 11 seconds       127.0.0.1:27017-27018->27017-27018/tcp                mongo
91df95a11229        cello-dashboard     "python dashboard.py"    12 seconds ago      Up 11 seconds       8080/tcp                                              dashboard
051efd511066        cello-watchdog      "python watchdog.py"     12 seconds ago      Up 11 seconds                                                             watchdog
a66bb112a21f        cello-restserver    "python restserver.py"   12 seconds ago      Up 12 seconds       80/tcp                                                restserver
d8949e774ece        cello-user-dashboard "bash -c 'cd /usr/ap…"  12 seconds ago      Up 12 seconds       0.0.0.0:8081->8080/tcp                                user-dashboard
57c8963f6943        cello-mongo         "docker-entrypoint.s…"   12 seconds ago      Up 12 seconds       27017/tcp                                             cello_dashboard_mongo_1
```

* `nginx`: [Nginx](https://nginx.org) is used as a reverse proxy to improve web performance.
* `mongo`: [MongoDB](https://www.mongodb.com) is used as the backend database.
* `dashboard`: Provides the admin dashboard using [Flask](http://flask.pocoo.org/).
* `watchdog`: Monitors the status of the system (e.g., chains' health).
* `restserver`: Core engine to do the provision, orchestration and management tasks.

## Make Command

A [Makefile](https://en.wikipedia.org/wiki/Makefile) is provided to help setup and manage the master node, please refer to the [make_support](make_support.md) page.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
