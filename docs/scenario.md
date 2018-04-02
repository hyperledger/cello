# Scenarios

## Admin Scenario
After start up, Cello provides a dashboard for administrators, which listens on localhost:8080.

The default login user name and password are `admin:pass`.

### Add/Delete a host

Admin can add a host (a single Docker host or a Swarm cluster) into the resource pool.

Then Cello will check and setup it with given configurations, e.g., if enabling autofill, then will fill the host with chains to the capacity.

Admin can also delete a host from the resource pool if it has no running chains.

### Config a host
Admin can manually update the host configuration, including:

* `name`: Human readable name alias.
* `capacity`: Maximum chain number on that host.
* `schedulable`: Whether to distribute chains on that host to users.
* `autofill`: Whether to keep host with running chains to its capacity.
* `log_type`: local or syslog.

### Operate a host

Admin can run several operations on a host, including:

* `fill`: Fill the host with chains to its capacity.
* `clean`: Clean up the free chains on that host.
* `config`: Edit the host config.
* `reset`: Re-setup the host when no cluster at it, e.g., cleaning useless docker containers.
* `delete`: Remove the host when no cluster at it.

### Automatic way

When the autofill box is checked on a host, then watchdog will automatically keep there are `capacity` number of healthy chains on that host.

e.g., if the capacity of one host is set to 10, then the host will be filled with 10 chains quickly. When 2 chains are broken, they will be replaced by healthy ones soon.

### Add/Delete chains
Admin can also manually add some specific chain to a host, or delete one.

### Operate a chain

Admin can run several operations on a chain, including:

* `start`: Start a chain if the chain is not running.
* `stop`: Stop a chain if the chain is running.
* `restart`: Restart a chain.
* `release`: Delete a in-used chain, and recreate with the same config.
* `delete`: Remove the chain.


## Users Scenario
After start up, Cello provides a dashboard for user, which listens on localhost:8081.

The default login user name and password are `admin:pass`.

### Apply a chain

User can manually apply a cluster, Cello will try to find available chains in the pool, to see if it can match the request.

If found one, Cello will return a chain for user, otherwise, construct an error response to user.

### Release a chain

User can manually release a cluster, Cello will check if the request is valid.

Cello will release it from user's available chains, and recreate it with the same name, at the same host, and potentially move it to active clusters pool. User can apply for it again.

### Invoke

User can invoke/query smart contract api, and get the response from api.

### Smart Contract

User can upload, install, instantiate, delete smart contract.


<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.