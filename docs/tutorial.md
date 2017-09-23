# Tutorial


## Basic Concepts

Have a look at the [terminology](./terminology.md) to understand the basic concepts.

## Setup a Cello Cluster

Following the [installation](./installation.md) to setup a Cello cluster.

After that, operators can interact with Cello through dashboard.

By default, the dashboard will listen on port `8080` at the Master Node, you can login with default administrator account of `admin:pass`.

## Add a Host

The first time you start Cello, there will be no hosts in the pool. There are two methods to add more hosts into the pool.

* Through the `Overview` page: Click the `+` button after the `Working Host` keyword;
* Through the `Hosts` page: Click the `Add Host` button at the top right corner.

Then you will see a jumped-out dialog to input the setup info.

![dashboard add host](imgs/tutorial_add_host.png)

Suppose it's a Native Docker server to import as a host, input those fields

* Name: docker_host
* Daemon URL: `192.168.7.220:2375` (replace this with your docker host address)
* Capacity: 5

After successful adding, you can find the `docker_host` shown in the Host page, with 0 chains and Cap is 5.

## Create a Chain

Now we have the free host in the pool, new chains can be create.

Open the Active Chain page, it should be empty now, click the `Add Chain` button on the top right corner, input those fields:

* Name: test_chain

And select the host with the `docker_host`.

![dashboard add chain](imgs/tutorial_add_chain.png)

Click the create button to add a new chain with name `test_chain` into the pool.

Then you can see it at the Active Chain page.

## Enable auto-mode

It will be difficult if you have a numbers of chains to create manually. Cello provides automated ways to save time.

* Use the host action dropdown menu: The Fillup button will fill the host full with chains until its at capacity, while the Clean button will clean all unused chains from the host.
* Use the Autofill checkbox: In the host configuration, you can find a `Autofill` checkbox, which will automatically watch the host and keep it full with chains to the capacity.

Try these methods as you like.

If you want to know more advanced operational skills, please continue to the [Dashboard](./dashboard.md).

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
