# Scenarios

## Admin

### Add/Delete a host

Admin can add a host (a single Docker host or a Swarm cluster) into the resource pool.

Then Cello will check and setup it with given configurations, e.g., if enabling autofill, then will fill the host with chains to the capacity.

Admin can also delete a host from the resource pool if it has no running chains.

### Config a host
Admin can manually update the host configuration, including:

* name: Human readable name alias.
* capacity: Maximum chain number on that host.
* schedulable: Whether to distribute chains on that host to users.
* autofill: Whether to keep host with running chains to its capacity.
* log_type: local or syslog.

### Operate a host

Admin can run several operations on a host, including:

* fill: Fill the host with chains to its capacity.
* clean: Clean up the free chains on that host.
* reset: Re-setup a host, e.g., cleaning useless docker containers.

### Add/Delete chains
Admin can also manually add some specific chain to a host, or delete one.

### Automatic way

When the autofill box is checked on a host, then watchdog will automatically keep there are `capacity` number of healthy chains on that host.

e.g., if the capacity of one host is set to 10, then the host will be filled with 10 chains quickly. When 2 chains are broken, they will be replaced by healthy ones soon.

## Chain users

### apply a cluster

User sends request to apply a cluster, Cello will try to find available chains in the pool, to see if it can match the request.

If found one, construct the response, otherwise, construct an error response.


### release a cluster

User sends request to release a cluster, Cello will check if the request is valid.

If found applied chain, then release and recreate it with the same name, at the same host, and potentially move it to released db collections.

If not found, then just ignore or response.
