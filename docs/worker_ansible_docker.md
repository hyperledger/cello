Cello Ansible agent docker container how-to
===========================================

Cello Ansible agent is a set of Ansible playbooks which allows developers and
Fabric network operators to stand up a Hyperledger Fabric network very quickly
in a set of virtual or physical servers in cloud or lab. Using ansible agent
docker image can greatly reduce the step of setting up the ansible controller
and remove the needs of getting the playbooks.

The following is the list of the general steps you can follow to use the
Ansible agent docker container to stand up your own fabric network:

1. [Get the docker image](#get-the-docker-image)
2. [Create configuration files](#create-configuration-files)
3. [Provision the servers](#provision-the-servers)
4. [Initialize the servers](#initialize-the-servers)
5. [Setup fabric network](#setup-fabric-network)
6. [Verify fabric network](#verify-fabric-network)

This document also provides the following sections to help you use the Cello
Ansible agent:

[Cloud configuration file details](#cloud-configuration-file-details)<br/>
[Fabric configuration file details](#fabric-configuration-file-details)<br/>
[Running an Ansible playbook](#running-an-ansible-playbook)<br/>
[Use ssh-agent to help Ansible](#ssh-agent-to-help-ansible)<br/>
[Convenient configurations and commands](#ccac)<br/>
[Use the existing servers](#use-the-existing-servers)<br/>
[Security rule references](#srrwy)<br/>

# <a name="get-the-docker-image"></a>Get the docker image

You need an Ansible controller to run Ansible playbooks. The Ansible agent
docker container becomes your Ansible controller when you run it. To get
ready to run it, simply execute the following commands:

        docker pull cello/ansibleagent
        docker run --rm cello/ansibleagent ansible --version

The results should show ansible configuration and version number. If you are
getting errors, then you may have not had docker engine installed. Please refer
offical [docker installation] (#https://docs.docker.com/install/) document to
install your docker.

## <a name="generate-a-ssh-key-pair"></a>Generate a ssh key pair

Ansible relies heavily on `ssh` to work with virtual or physical servers. To
establish an ssh connection to the servers, you will need an ssh key pair.
Ansible agent docker container already has a ssh key pair named fd and fd.pub
created and placed in the /opt/agent/vars directory. The container actually
start up ssh agent using that key pair. You can create your own ssh key in
your own local directory, then mount that directory to /opt/agent/vars directory
to make the container use your own ssh key pair.

Here are the steps to generate a key pair:

        mkdir -p ~/vars && cd ~/vars && ssh-keygen -t rsa -f fd -P ""

This will create a ssh key pair without a passphrase in your ~/vars
directory. The name of the private and public key files will be
`fd` and `fd.pub`, respectively. In the default Ansible agent playbook
configuration files, the ssh key is assumed to exist at that location with those
names. If you use different names, then you will need to change the
configuration to match your own ssh key pair filenames.

When you run the playbook against a cloud such as OpenStack or AWS, the ssh
public key you generated above will be automatically injected into the servers
during the [Provision the servers](#provision-the-servers) step. If your servers
were not provisioned by the Cello Ansible agent, you will have to manually
inject/copy the public key onto each machine. For each machine, you will also
need to place the ssh public key in the file named ~/.ssh/authorized_keys in
the user account which you will use to log into the server.

# <a name="provision-the-servers"></a>Provision the servers

This initial step provisions a set of virtual servers from cloud in a cloud provider.

        docker run --rm -v /home/ubuntu/run:/opt/agent/run \
        -v /home/ubuntu/vars:/opt/agent/vars cello/ansibleagent \
        ansible-playbook -e "mode=apply env=mycloud cloud_type=os" provcluster.yml

The above command will provision (prov is short for provision) a cluster of
virtual machines using an OpenStack cloud, with the environment and
configuration defined in the `vars/mycloud.yml` file. The value `apply` for
the parameter `mode` tells the playbook to create the resources. The value `os`
for the parameter `cloud_type` indicates that we are running this playbook
against an OpenStack cloud. The value `mycloud` for the parameter `env` indicates
the cloud config file `vars/mycloud.yml` should be used. The possible values for
mode are `apply` and `destroy`, the possible values for cloud_type are `os`, `aws`
and `azure` at present.

This step produces a set of servers in your cloud and an Ansible host file
named runhosts in this directory on your Ansible controller:

        $AAROOT/run

If you are working with servers already exist, you will need to follow
the section [Use the existing servers](#use-the-existing-servers) to continue
setting up your fabric network.

To remove everything this step created, run the following command:
        docker run --rm -v /home/ubuntu/run:/opt/agent/run \
        -v /home/ubuntu/vars:/opt/agent/vars cello/ansibleagent \
        ansible-playbook -e "mode=destroy env=mycloud cloud_type=os" provcluster.yml

# <a name="initialize-the-servers"></a>Initialize the servers

This step will install all necessary software packages, setup an overlay
network, and configure DNS services and registrator services on the machines created in
previous step:

        ansible-playbook -i run/runhosts -e "mode=apply env=mycloud env_type=flanneld" initcluster.yml

The parameter `env` is same as in previous step. The parameter `env_type`
indicates what communication environment you would like to setup. The possible
values for this parameter are `flanneld` and `k8s`. Value `flanneld` is used to
setup a docker swarm like environment. Value `k8s` is to set up a Kubernetes
environment.

To remove everything this step created, run the following command:

        ansible-playbook -i run/runhosts -e "mode=destroy env=mycloud env_type=flanneld" initcluster.yml

# <a name="setup-fabric-network"></a>Set up the Fabric network

This step will build (or download from a Docker repository) the various required
Fabric binaries and docker images, create certificates, and eventually run
various fabric components such as peer, orderer, kafka, zookeeper, fabric ca,
etc on the environment produced by the previous steps:

        ansible-playbook -i run/runhosts -e "mode=apply env=myfabric deploy_type=compose" setupfabric.yml

The `env` value in the command indicates which Fabric network configuration to
use. The meaning of this parameter is a bit different compared to the
previous commands. The parameter deploy_type determines if docker
compose will be used to deploy, or Kubernetes will be used to deploy.
This should corrlate to the `env_type` parameter given in the
[Initialize the servers](#initialize-the-servers) step.

To remove everything this step created, run the following command:

        ansible-playbook -i run/runhosts -e "mode=destroy env=myfabric deploy_type=compose" setupfabric.yml

# <a name="verify-fabric-network"></a>Verify the Fabric network

If all previous steps run without any errors, you can run the following playbook
to verify the running status of each container:

        ansible-playbook -i run/runhosts -e "mode=verify env=bc1st" verify.yml

The `env` value in the command should match the value used in [Setup the fabric network](#setup-fabric-network)
The command should access all the servers and display the container
status for each container in your fabric network. If these containers do not
exit/crash, then you know you have successfully deployed your own fabric network.

# Useful tips for running the Ansible agent

## <a name="cloud-configuration-file-details"></a>Cloud configuration file details

The cloud configuration file is used by Ansible agent to work with a specific
cloud. It is very important to make every field in the file accurate according
to your own cloud. Most of the information in this file should be
provided by your cloud provider. If you are not 100% sure what value a field
should have, it would be a good idea to use the corresponding value in the
sample cloud configuration file. The following section describes what each
field means. Please use [vars/os.yml](https://github.com/hyperledger/cello/blob/master/src/agent/ansible/vars/os.yml)
as a reference and see example values for these fields:

```
auth: Authorization fields for a cloud
auth_url: url for cloud Authorization
username: User name to log in to the cloud account
password: Password for the user of the cloud account
project_name: Name of the project of your cloud, specific to OpenStack
domain: The domain of the project, specific to OpenStack
cluster: This section defines how virtual machines should be created
target_os: The operating system we are targeting, it has to be `ubuntu`
    at present
image_name: Cloud image name to be used to create virtual machines
region_name: Region name for VMs to reside in, leave blank if unsure
ssh_user: The user id to be used to access the virtual machines via ssh
availability_zone: The availability zone, leave blank to use default
validate_certs: When access cloud, should the certs to be validated?
    Set to false if your cloud use self signed certificate
private_net_name: The private network name from your cloud account on
    which your VMs should be created
flavor_name: Flavor name to create your virtual machine
public_key_file: The public ssh key file used to connect to servers,
    use absolute path
private_key_file: The private ssh key file, use absolute path,
    public_key_file and this key file should make a pair
node_ip: Use public ip or private ip to access each server, only possible
    value are `public_ip` and `private_ip`
assign_public_ip: Should each VM be allocated public IP address or not, true
    or false, default is true
container_network: This section defines overlay network, you should not
    change this unless you absolutely know what you are doing
Network: Overlay network address space, should be always in cidr notion,
    such as 172.16.0.0/16
SubnetLen: The bit length for subnets, it should be 24 normally, do not
    change it unless you absolutely know what you are doing
SubnetMin: minimum subnet
SubnetMax: maximum subnet
Backend: backend for flanneld setup
Type: the type for flanneld setup
Port: the port to use
service_ip_range: when use k8s, this defines service ip range
dns_service_ip: dns service ip address for k8s
node_ips: a list of public IP addresses if you like the VMs to be accessible
    and using preallocated IP addresses
name_prefix: VM name prefix when create new VMs, this combines with
    stack_size to make VM names. These names will be used in fabric
    configuration For example,if your prefix is fabric, and stack
    size is 3, then you will have 3 VMs named fabric001, fabric002,
    fabric003, these names will be referred as server logic names
domain: domain name to use when create fabric network nodes.
stack_size: how many VMs to be created
etcdnodes: which nodes you like the etcd to be set up on. only needed
    for k8s, should be a list of logic name like fabric001, fabric002,
    fabric003
builders: which VM to be used to build fabric binaries. should be only one
    machine, use logic name like fabric001, fabric002, etc.
flannel_repo: The url point to the flanneld tar gz file
etcd_repo: The url point to the etcd tar gz file
k8s_repo: The url point to the k8s binary root directory
go_repo: The url point to the go lang tar gz file
volume_size: when create VMs the size of the volume
block_device_name: block device name when create volume on OpenStack cloud
    fabric network, to verify that, you can run the following command to see
```

## <a name="fabric-configuration-file-details"></a>Fabric configuration file details

The Fabric configuration file defines how your Fabric network will look,
how many servers you will use, how many organizations you would like to
create, how many peers and orderers each organization has, and how many
kafka and zookeeper containers will be set up. Additionally, it defines
what names will be given to organizations, peers, orderers etc. This file
defines the topology of your Fabric network, and a good understanding
of this file is essential in order to create the Fabric network you need.
Please use [vars/bc1st.yml](https://github.com/hyperledger/cello/blob/master/src/agent/ansible/vars/bc1st.yml)
as a reference and see example values for these fields:

```
GIT_URL: hyperledger fabric git project url. should be always
    "http://gerrit.hyperledger.org/r/fabric"
GERRIT_REFSPEC: ref spec when build a specifc patch set. for example, it
    can be "refs/tags/v1.0.5"
fabric: This section define hyperledger fabric network layout
ssh_user: The user name to be used to log in to the remote servers
peer_db: The peer database type, possible values are CouchDB and leveldb
tls: Should this deployment use tls, default is false,
network: This section defines the layout of the fabric network
fabric001: This defines fabric containers running on the node named
    fabric001, each virtual or physical machine should have a section
    like this.
cas: list of the fabric certificate authority for an organization,
    the name of each ca should be in the format of <name>.<orgname>,
    for example, ["ca1st.orga", "ca1st.orgb"]
peers: list of the peers run on this node, the format of the names
    shuold be <role>@<name>.<orgname>, for example,
    ["anchor@peer1st.orga","worker@peer2nd.orga"], this means that
    there will be two peers running on this node, they are both from
    organization named orga, one is acting as
    anchor node, the other is the worker node.
orderers: list of the orderers run on this node, the format of the
    names should be <name>.<orgname>, for example, ["orderer1st.orgc",
    "orderer2nd.orgc"], this means that there will be two orderers
    running on this node, they are both from organization named orc,
    one is named orderer1st, and the other named orderer2nd.
zookeepers: list of the zookeeper containers run on this node. The
    format for zookeeper containers are <name>, since zookeeper
    containers do not belong to any organization, their names should
    be simply a string. For example: ["zookeeper1st", "zookeeper2nd"],
    this means that there will be two zookeeper containers running on
    this node, their names are zookeeper1st and zookeeper2nd respectively.
kafkas: list of the kafka containers run on this node The format for
    kafka containers are <name>, since kafka containers do not belong
    to any organization, their name should be simply a string. For
    example, ["kafka1", "kafka2"], this means that there will be two
    kafka containers running on this node, their names are kafka1 and
    kafka2.
baseimage_tag: docker image tag for fabric-peer, fabric-orderer,
    fabric-ccenv,fabric-tools. for example, it can be "x86_64-1.1.0-alpha",
    The value of this field is very important, if this value is empty,
    that means you like to build the fabric binaries and possibly docker
    container images. This field and the repo section determins where to
    download binaries or should binaries be downloaded.
helper_tag: docker image tag for container fabric-ca, fabric-kafka,
    fabric-zookeeper, for example, it be "x86_64-1.1.0-preview"
ca: This section defines how the fabric-ca admin user id and password
admin: ca user admin name
adminpw: ca admin user password
repo: This section defines where to get the fabric docker image and
    binary tar gz file. This allows you to use a local docker repository
url: Docker image repository for fabric, for example if you are using
    docker hub, the value will be "hyperledger/", if you are using
    nexus3, the value will be "nexus3.hyperledger.org:10001/hyperledger/"
bin: The url point to the fabric binary tar gz file which contains
    configtxgen, configtxlator, cryptogen etc.
```

## <a name="k8s-admin-dashboard"></a>K8S admin dashboard

Starting with Cello 0.8.0, Ansible agent has been upgraded to securely enable
a k8s dashboard when you choose to deploy fabric network over k8s. The Ansible
agent comes with a set of self-signed certificates in a directory named
`secrets/certs`, if you do not want to use the default certificates, you
should replace these certificates with your own. The Agent also creates a pair
of users named `admin` and `fabric`. These are defined in the
`secrets/users/token.csv` file. You can change and set your own passwords for
these users here. Once you have everything set up, you should be able to access
the k8s dashboard at the following url:

        https://<node_ip>>:32334/

When you are asked for the token, you can use either `admintoken`
or `fabrictoken` to login.

## <a name="running-an-ansible-playbook"></a>Running an Ansible playbook

Ansible allows you to run tasks in a playbook with particular tags or skip
particular tags. For example, you can run the follow command

```
    ansible-playbook -i run/runhosts -e "mode=apply env=bc1st \
    deploy_type=compose" setupfabric.yml --tags "certsetup"
```
The above command will use the runhosts inventory file and only run tasks
or plays tagged `certsetup`, all other plays in the playbooks will be
skipped.

```
    ansible-playbook -i run/runhosts -e "mode=apply env=bc1st \
    deploy_type=compose" setupfabric.yml --skip-tags "certsetup"
```
The above command will run all tasks *except for* the tasks/plays tagged `certsetup`

## <a name="ssh-agent-to-help-ansible"></a>Setting up ssh-agent

Since Ansible's only means of communicating with the servers it configures is
ssh, setting up `ssh-agent` on the Ansible controller is very important. If
you do not do this, Ansible will likely fail to connect to your machines.
Follow the steps below to set up ssh-agent on the Ansible controller
(the machine you run the Ansible script on).

1. Create a ssh key pair (only do this once):

        ssh-keygen -t rsa -f ~/.ssh/fd

2. Run this command once in the active shell session you will run the Ansible
script from :

        eval $(ssh-agent -s)
        ssh-add ~/.ssh/fd

3. For the servers created via cloud providers, this step is already done for
you. For existing servers, you will need to make sure that the fd.pub
key is in the file ~/.ssh/authorized_keys. Otherwise, the servers will
reject the ssh connection from Ansible controller.

## <a name="ccac"></a>Convenient configurations and commands

At the root directory of the Ansible agent there are set of preconfigured
playbooks, they were developed as a convenient sample playbooks for you if you
mainly work with a particular cloud. Here's a list of these playbooks.

```
aws.yml
awsk8s.yml
os.yml
osk8s.yml
vb.yml
vbk8s.yml
```

These files use their corresponding cloud and fabric configuration
files. For example, `aws.yml` uses `vars/aws.yml` and `vars/bc1st.yml` to set up
a multi-node Fabric network on AWS. `awsk8s.yml` uses `vars/aws.yml` and
`vars/bc1st.yml` to set up a multi-node Fabric network on AWS within a k8s cluster.
To use these playbooks, you simply need to make small changes in the coresponding
configuration files in the `vars` directory, then issue the following command:

To stand up a Fabric network on AWS:
```
    ansible-playbook -e "mode=apply" aws.yml
```
To destroy a Fabric network on AWS:
```
    ansible-playbook -e "mode=destroy" aws.yml
```

If your target environment is OpenStack, then you will be using a slightly different
command:

```
    ansible-playbook -e "mode=apply" os.yml or osk8s.yml
    ansible-playbook -e "mode=destroy" os.yml or osk8s.yml
```

## <a name="use-the-existing-servers"></a>Using existing servers

When you have a set of physical servers or virtual machines already
available, you can still use the Ansible agent to stand up your Fabric
network. To do that, you will need to manually configure some provisioning
steps.

There are two things you need to do, one is to ensure that
your servers can be accessed via ssh, the second is to produce a runhosts
file like the one below. The hostnames of these servers have to form a patten
using a prefix with three digits, for example, fabric001, fabric002, fabric003.
The word `fabric` serves as a default prefix which can be changed to any string in
the cloud configuration file. After the prefix, the three digit postfix should start at
001, and increment up to the defined stack size. In the below example, the prefix is
`fabric`, but you can use any string you prefer as long as it is the same as
the cloud configuration file's `name_prefix` field:

```
    cloud ansible_host=127.0.0.1
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
```

The above file is a typical Ansible host file. The `cloud ansible_host` should be your Ansible
controller server, you should not change that line. All other lines in the file represent
a server, `private_ip` and `public_ip` are a concept that only applies to cloud
providers. If your servers are not in a cloud, then you can use the server's IP
address for both private_ip and public_ip field, but you cannot remove these two
fields. The `inter_name` field is also important, you should name
the server sequentially and these names will be used in later configuration to allocate
Hyperledger Fabric components. Group `allnodes` should list all the servers other than the
Ansible controller node. Group `etcdnodes` should list all the servers that you wish to install
etcd services on. Group `builders` should contain just one server that you wish to use to build
Hyperledger Fabric artifacts such as executables and docker images.

## <a name="srrwy"></a>Required Ports And Security Considerations

When you work with the public cloud, it is important to open or close certain
ports for security and communication reasons. The following ports are
used by the flanneld overlay network and other services of the Fabric network. You
will need to make sure that the ports are open. The following example assumes
that the overlay network is 10.17.0.0/16 and the docker host network is
172.31.16.0/20:

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
