Cello Ansible agent docker container how-to
===========================================

Cello Ansible agent is a set of Ansible playbooks which allows developers and
Fabric network operators to stand up a Hyperledger Fabric network very quickly
in a k8s cluster.

The following is the list of the general steps you can follow to use the
Ansible agent docker image to stand up your own fabric network:

1. [Get the docker image](#get-the-docker-image)
2. [Create configuration files](#create-configuration-files)
3. [Setup fabric network](#setup-fabric-network)


## <a name="get-the-docker-image"></a>Get the docker image

The Ansible agent docker image is available on docker hub, use the following
command to pull it:

```
   docker pull hyperledger/cello-ansible-agent:latest
   docker run --rm hyperledger/cello-ansible-agent:latest ansible --version
```
The results should show ansible configuration and version number. If you are
getting errors, then you may have not had docker engine installed. Please refer
offical [docker installation](#https://docs.docker.com/install/) document to
install your docker.

## <a name="create-configuration-files"></a>Create configuration files

To stand up a fabric network, you will need a set of files, here is the list

   1. K8s configuration file, to get access to a k8s cluster
   2. Network spec file, to define fabric network layout
   3. Resource file, k8s resource allocation for each type of fabric nodes

The k8s configuration file is needed to gain access to a k8s cluster. Many cloud
providers provide the k8s configuration file for you to download once you have
a k8s cluster. If no direct download, these providers most likely provides you
a way to create such file.

The Fabric network spec file defines how your Fabric network will look,
how many organizations you would like to create, how many peers and orderers
each organization has, and how many kafka and zookeeper containers will be set
up. Additionally, it defines what names will be given to organizations, peers,
orderers etc. This file defines the topology of your Fabric network, and a good
understanding of this file is essential in order to create the Fabric network
you like.

The resource file allows you to allocate k8s resources such as cpu and memory for
each type of nodes in your fabric network, for example, peer and orderer.

[Download sample network sepc files and resource files](https://github.com/hyperledger/cello/tree/master/src/operator-dashboard/agent/ansible/vars)

Sample fabric network spec
[bc1st.yml](https://github.com/hyperledger/cello/tree/master/src/operator-dashboard/agent/ansible/vars/bc1st.yml) and
[bc2nd.yml](https://github.com/hyperledger/cello/tree/master/src/operator-dashboard/agent/ansible/vars/bc2nd.yml)

Sample resource file [resource.yml](https://github.com/hyperledger/cello/tree/master/src/operator-dashboard/agent/ansible/vars/resource.yml)


Follow the below process to prepare for setting up your fabric network:

```
   1. Create a directory named vars, any file mentioned must be in this directory
   2. Name your k8s configuration file kubeconfig
   3. Download or create your own network spec file, name it networkspec.yml
   4. Download or create your own resource file, name it resource.yml
```

## <a name="setup-fabric-network"></a>Set up and destroy the Fabric network

This step will stand up a fabric network based on your network spec file

```
   docker run --rm -v $(pwd)/vars:/opt/agent/vars hyperledger/cello-ansible-agent \
   ansible-playbook -i hosts -e "mode=apply env=networkspec" setupfabric.yml
```

To remove everything the above step created, run the following command:

```
   docker run --rm -v $(pwd)/vars:/opt/agent/vars hyperledger/cello-ansible-agent \
   ansible-playbook -i hosts -e "mode=destroy env=networkspec" setupfabric.yml
```

Notice the only difference between these two commands is the word `apply` and `destroy`

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
<img alt="Creative Commons License" style="border-width:0"
src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />
This work is licensed under a
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
Creative Commons Attribution 4.0 International License</a>.
