# Cello Ansible agent how to

Recently added ansible agent is a cello agent which allows developers and fabric
network operators to stand up fabric network on cloud environment, physical
machines or virtual machines by using ansible.

To use the cello ansible agent (the agent), you will need to install ansible
version 2.3.0.0 or above and some ansible could modules based on which cloud
you may use, for example, if you like to use OpenStack cloud to deploy fabric
network, in addition to ansible, you will also need to install OpenStack Shade
which is the ansible OpenStack cloud module. If you choose to use AWS, then in
addition to ansible, you will need to install boto and boto3 which are Ansible
AWS cloud modules.

The general steps of using the agent::

1. Install Ansible and necessary cloud modules, the machine you install ansible and cloud modules is normally called ansible controller.
2. Use ssh-keygen to generate a key pair which you will be using to access virtual machines provisioned against a cloud, or virtual or physical machines that you already have.
3. According to your choice of environment, create a cloud configuration file and a fabric network layout configuration file.
4. Provision the servers
5. Initialize and prepare the servers
6. Setup fabric network
7. Verify that the fabric network is working correctly
8. Cleanup

This document goes into great details to describe these files. If you choose
to use some existing servers regardless they are physical or virtual, you will
need to manually create a runhosts file and inject the ssh public key into
echo server so that ansible controller can access them. These servers will also
need to be made sure having python installed, otherwise, ansible cannot work
appropriately.

The following sections describe in details about each step

## Setup ansible controller

Ansible controller can be any machine, as long as you can install ansible
2.3.0.0 or above onto, it can be a small virtualbox VM or your own laptop.
Please follow offical ansible installation instructions from ansible if you
have questions on how to install ansible on a specific platform.

## Use ssh-keygen to create a key pair for ansible to work with servers

Ansible heavily rely on ssh to work with virtual or physical machines. When
you have a cloud such as OpenStack, AWS, the ssh public key is automatically
injected into the severs, when you are working with servers not setup by the
provisioning modules of the agent, you will have to manually inject the public
key into each machine. But in any case, you will need a pair of key.

To generate a ssh key pair, you just need to run ssh-keygen.
To inject a ssh public key into a server, you will need to add the public key
onto ~/.ssh/authorized_keys in the user's home directory. That user should be
the user that you use to access the machine.

## Create cloud configuration file and fabric layout configuration file


To work with a cloud, you will need to have an account from a cloud. To create
a set of machines from a cloud, you will also need to tell a cloud a bit more
about your desire on how the machines will be created. All the information needed
to accomplish this is specified in the cloud configuration file. Examples of
these files can be found in src/agent/ansible/vars directory. Cloud
configuration file is used to access your cloud, provide credentials, specify
network attributes and virtual machine specs (flavor) etc. For pupular clouds
such as OpenStack, AWS and Azure, you can see examples in the directory, files
os.yml, aws.yml and azure.yml are examples for OpenStack, AWS and Azure cloud
environment.

To stand up a fabric network, you will need to specify how many organizations
participating in the network, how many fabric components such as peers,
orderers in each organization, and how the kafka and zookeeper cluster should
look like. All the information needed to accomplish this is specified in
fabric network layout configuration file. A typical fabric network will be
comprised of orderers, peers, kafka, zookeeper, and ca nodes. For details on
what each component does and how they interact with each other, please see
the [Hyperledger Fabric docs](https://hyperledger-fabric.readthedocs.io/en/release/)
Layout configuration file specifies how you want to layout your fabric network
components cross the servers that you have, for example, how many organizations,
how many peers, ordereres from each org, how many kafka, zookeeper nodes in
the cluster. The examles of this kind configuration file can be found in
src/agent/ansible/vars directory, files bc1st.yml, vb1st.yml are examples for
multiple nodes fabric network, file bc2nd.yml is an example for a single node
fabric network.

## Provision the servers

This step is to provision a set of virtual servers from an OpenStack cloud.
Before you run the following command, you will need to either make a copy
of the vars/os.yml file or make changes to that file to reflect your cloud
settings. If you already have a set of servers (such as a set of VirtualBox
virtual machines), you can skip this step, but you will need to follow the
instructions below to manually create a runhosts file.

With the correct cloud environment settings in vars/os.yml, run the script
to provision a set of virtual machines::

    ansible-playbook -e "mode=apply cloud_type=os env=os password=XXXXX" provcluster.yml


The above command will provision (prov is short for provision) a cluster of
virtual machines on your OpenStack cloud the environment defined in vars/os.yml
file. Replace xxxxx with your own password from your cloud provider. Replace
os with your own cloud environment file if you decided to create a new one.
If you like to provision from other cloud, you will need to specify the
cloud_type to be aws, azure, or other cloud (plan to support aws).

This step produces a set of servers and an ansible host file named run/runhosts.

### Manually create a runhosts file with servers already available

If you already have a set of servers available that you wish to use, then you
can create a file by following the example below. And also make sure these
server's hostname get setup as XXXXX001, XXXXX002, etc and they can can see
each other by their hostnames. The XXXXX should be replaced with your own
perference which gets used in the later configuration. In this example, the
word "fabric" is used, but it can be anything that you prefer, make sure
they are consistent.

    cloud ansible_host=127.0.0.1 ansible_python_interpreter=python
    169.45.102.186 private_ip=10.0.10.246 public_ip=169.45.102.186 inter_name=fabric001
    169.45.102.187 private_ip=10.0.10.247 public_ip=169.45.102.187 inter_name=fabric002
    169.45.102.188 private_ip=10.0.10.248 public_ip=169.45.102.188 inter_name=fabric003

    [allnodes]
    169.45.102.186
    169.45.102.187
    169.45.102.188

    [etcdnodes]
    169.45.102.186
    169.45.102.187
    169.45.102.188

    [builders]
    169.45.102.186

The above file is a typical ansible host file. The cloud ansible_host should be your ansible
controller server, you should not change that line. All other lines in the file represent
a server, private_ip and public_ip are the concept for cloud, if your servers are not in
a cloud, then you can use the server's IP address for both private_ip and public_ip field,
but you can not remove these two fields. The inter_name is also important, you should name
the server sequentially and these names will be used in later configuration to allocate
hyperledger fabric components. Group allnodes should list all the servers other than the
ansible controller node. Group etcdnodes should list all the servers that you wish to install
etcd services on. Group builders should list all the servers that you wish to use to build
hyperledger fabric artifacts such as executables and docker images.

## Initialize and prepare the servers

    ansible-playbook -i run/runhosts -e "mode=apply env=os env_type=flanneld" initcluster.yml

The above command will initilize the cluster using flanneld overlay network. It installs
flanneld network, dns and registrator services. Plan to support kubernetes in future.

## Setup the fabric network

    ansible-playbook -i run/runhosts -e "mode=apply env=bc1st deploy_type=compose" setupfabric.yml

The env value in the command indicates which fabric network configuration to use.
Variable deploy_type needs to be set to compose. If it is set to k8s, it means
that you choose to use kubernetes environment. In above example, ansible looks
file bc1st.yml in vars directory, you can create as many files in that directory
to reflect your own fabric network.

## Verify that the fabric network is working correctly

    ansible-playbook -i run/runhosts -e "mode=verify env=bc1st" verify.yml

The above command should acess the server and display all the container status
in your next work.

## Cleanup

Once you're done with it, don't forget to nuke the whole thing::

    ansible-playbook -e "mode=destroy env=bc1st deploy_type=compose" setupfabric.yml

The above command will destroy all the fabric resources created such as
the executables on the build machines and all the fabric containers on
all the servers.

If you created the entire environment on your cloud, and you do not
want these machines any more, execute the following command to get rid
of all the servers::

    ansible-playbook -e "mode=destroy env=os password=XXXXX cloud_type=os" provcluster.yml

## Details about the cloud configuration file

Here is the os.yml file in cello/src/agent/ansible/vars directory.

    ---
    auth: {
      auth_url: "https://salesdemo-sjc.openstack.blueboxgrid.com:5000/v2.0",
      username: "litong01",
      password: "{{ password | default(lookup('env', 'password')) }}",
      project_name: "Interop"
    }

    # This variable defines cloud provision attributes
    cluster: {
      target_os: "ubuntu",
      image_name: "Ubuntu 16.04",
      region_name: "",
      ssh_user: "ubuntu",
      availability_zone: "compute_enterprise",
      validate_certs: True,
      private_net_name: "demonet",
      flavor_name: "m1.medium",
      public_key_file: "/home/ubuntu/.ssh/fd.pub",
      private_key_file: "/home/ubuntu/.ssh/fd",
      # This variable indicate what IP should be used, only valid values are
      # private_ip or public_ip
      node_ip: "public_ip",

      container_network: {
        Network: "172.16.0.0/16",
        SubnetLen: 24,
        SubnetMin: "172.16.0.0",
        SubnetMax: "172.16.255.0",
        Backend: {
          Type: "udp",
          Port: 8285
        }
      },

      service_ip_range: "172.15.0.0/16",
      dns_service_ip: "172.15.0.4",

      # the section defines preallocated IP addresses for each node, if there is no
      # preallocated IPs, leave it blank
      node_ips: ["169.45.102.186", "169.45.102.187", "169.45.102.188"],

      # fabric network node names expect to be using a clear pattern, this defines
      # the prefix for the node names.
      name_prefix: "fabric",
      domain: "fabricnet",

      # stack_size determines how many virtual or physical machines we will have
      # each machine will be named ${name_prefix}001 to ${name_prefix}${stack_size}
      stack_size: 3,

      etcdnodes: ["fabric001", "fabric002", "fabric003"],
      builders: ["fabric001"],

      flannel_repo: "https://github.com/coreos/flannel/releases/download/v0.7.1/flannel-v0.7.1-linux-amd64.tar.gz",
      etcd_repo: "https://github.com/coreos/etcd/releases/download/v3.2.0/etcd-v3.2.0-linux-amd64.tar.gz",
      k8s_repo: "https://storage.googleapis.com/kubernetes-release/release/v1.7.0/bin/linux/amd64/",

      go_ver: "1.8.3",
      # If volume want to be used, specify a size in GB, make volume size 0 if wish
      # not to use volume from your cloud
      volume_size: 0,
      # cloud block device name presented on virtual machines.
      block_device_name: "/dev/vdb"
    }

auth section specifies the credentials to access your cloud. cluster section
provides more detailed information how virtual machines will be created on
OpenStack cloud. private_key_file and public_key_file should point to the
ssh key pair that you may have created in step #2. stack_size in this example
was set to 3, that means you will create 3 VMs in your cloud, their names
will be fabric001, fabric002 and fabric003 since the name_prefix field was
set to "fabric". domain field specifies the fabric network domain, it can be
anything you like, it is just a string. etcdnodes field indicates on which
nodes that you want to setup etcd services which is required by overlay
network and also kuberenetes. builders field specifies on which node you
like to build fabric binaries such as cryotogen, configtxgen, docker images.
Remember that the name fabric001, fabric002 etc are logic names. They do not
have to be set to your machine's hostname. When you do things in the OpenStack
or AWS, these logic name will be alos be used as hostnames of the virtual
machines, but they do not have to be. Other fields such as flanneld_repo,
etcd_repo, k8s_repo, go_ver are the fields indicate where to download needed
binaries.

A bit more information for each field::

    target_os: operating system that your servers will be using
    image_name: cloud image you like to use to create virtual servers.
    ssh_user: user id used by ssh to log in each server,
    availability_zone: OpenStack availability zone
    validate_certs: if validate the certificates when access servers.
    private_net_name: private network name where servers being created on
    flavor_name: virtual server specs
    public_key_file: ssh public key file
    private_key_file: ssh private key file
    node_ip: use either private_ip or public_ip when access the servers
    node_ips: preallocated ip addresses for each server
    container_network: overlay network settings, do not change this
      unless you absolutely know what you are doing
    name_prefix: how to name virtual servers, can be any character except dot
    domain: the fabric network domain name, can be any character except dot
    stack_size: how many virtual servers to create,

    etcdnodes: which servers to install etcd services
    builders: which server to be used for building hyperledger fabric

    flannel_repo: where to download flanneld
    etcd_repo: where to download etcd

    go_ver: version of golang to be installed
    volume_size: future use
    block_device_name: future use


## Details about the fabric netowkr layout configuration file

Here is the bc1st.yml (short for block chain 1st network)::

    ---
    # The url to the fabric source repository
    GIT_URL: "http://gerrit.hyperledger.org/r/fabric"

    # The gerrit patch set reference, should be automatically set by gerrit
    GERRIT_REFSPEC: "refs/tags/v1.0.0-rc1"

    # This variable defines fabric network attributes
    fabric: {
      ssh_user: "ubuntu",
      network: {
        fabric001: {
          cas: ["ca.orga", "ca.orgb"],
          peers: ["leader@1stpeer.orga", "leader@1stpeer.orgb"],
          orderers: ["1storderer.orgc", "1storderer.orgd"],
          zookeepers: ["zookeeper1st"],
          kafkas: ["kafka1st"]
        },
        fabric002: {
          cas: ["ca.orgc", "ca.orgd"],
          peers: ["anchor@2ndpeer.orga", "anchor@2ndpeer.orgb"],
          orderers: ["2ndorderer.orgc", "2ndorderer.orgd"],
          zookeepers: ["zookeeper2nd"],
          kafkas: ["kafka2nd"]
        },
        fabric003: {
          peers: ["worker@3rdpeer.orga", "worker@3rdpeer.orgb"],
          zookeepers: ["zookeeper3rd"],
          kafkas: ["kafka3rd", "kafka4th"]
        }
      },
      baseimage_tag: "1.0.0-rc1"
    }

In above configuration, the fabric network will use 3 servers. The ansible
controller will use ssh_user value to ssh connect to these servers to setup
various components. baseimage_tag dictates what container images will be
used to start fabric containers. If you intend to build images from the
source code, you can happily leave the value of baseimage_tag to be blank,
ansible controller will extract the source code using variables GERRIT_REFSPEC
and GIT_URL to get the code, then compile and build all artifacts. These
artifacts will be eventually pushed onto all the nodes and containers will
be started using these images. If you just want to build from the latest
code, then you can leave GERRIT_REFSPEC to be also blank. Other fields in
the configuration file is self explanatory. Make changes according to your
desire. The example bc1st.yml file defined 3 zookeeper nodes, 4 kafka nodes,
4 organizations, peers and orderers. Peers also being defined as anchor peer,
leader peer or just simply worker peer. For your own configuration, you
should create similar file to reflect your own fabric network setups, then
use the file name in the place of bc1st in the ansible command to ultimately
setup your fabric network.


# Extra information about cello ansible agent

## The method for running just a play, not the entire playbook

The script will create an ansible inventory file named runhosts at the very
first time you run the playbook, the inventory file will be place at a
directory named "run" at the root directory of the playbook. This file will be
updated in later runs if there are changes such as adding or removing hosts.
With this file, if you like to run only few plays, you will be able to do
that by following the example below:

    ansible-playbook -i run/runhosts -e "mode=apply env=bc1st deploy_type=compose" setupfabric.yml
      --<skip->tags "certsetup"

The above command will use the runhosts inventory file and only run play
named certsetup, all other plays in the play books will be skipped. All
available plays can be found in roles directory, each directory name is
a name can be used in either --tags to be executed or --skip-tags not to
be executed.

## ssh-agent to help ansible

Since ansible access either the virtual machines that you create on a
cloud or machines that you may already have by using ssh, setting up
ssh-agent on the ansible controller is very important, without doing
this most likely, the script will fail to connect to your servers.
Follow the steps below to setting your ssh-agent on ansible controller
which should be always the machine that you run the ansible script.

1. Create a ssh key pair (only do this once)::

        ssh-keygen -t rsa -f ~/.ssh/fd

2. Run the command once in a session in which you run the ansible script::

        eval $(ssh-agent -s)
        ssh-add ~/.ssh/fd

3. For the servers created in the cloud, this step is already done for
you. For the existing servers, you will need to make sure that the fd.pub
key is in the file ~/.ssh/authorized_keys. Otherwise, the servers will
reject the ssh connection from ansible controller.

## Security rule references when you setup fabric network on a cloud

When you work with a cloud, often it is important to open or close certain
ports for the security and communication reasons. The following port are
used by flanneld overlay network and other services of fabric network, you
will need to make sure that the ports are open. The following example assumes
that the overlay network is 10.17.0.0/16 and the docker host network is
172.31.16.0/20, you should make changes based on your network::

    Custom UDP Rule  UDP  8285              10.17.0.0/16
    Custom UDP Rule  UDP  8285              172.31.16.0/20
    SSH              TCP  22                0.0.0.0/0
    Custom TCP Rule  TCP  2000 - 60000      10.17.0.0/16
    Custom TCP Rule  TCP  2000 - 60000      172.31.16.0/20
    DNS (UDP)        UDP  53                172.31.16.0/20
    DNS (UDP)        UDP  53                10.17.0.0/16
    All ICMP - IPv4  All  N/A               0.0.0.0/0

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
<img alt="Creative Commons License" style="border-width:0"
src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />
This work is licensed under a
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
Creative Commons Attribution 4.0 International License</a>.