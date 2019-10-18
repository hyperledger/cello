Cello Fabric Operator How-to
===========================================

Cello Fabric Operator is a Kubernetes Operator which uses the Kubernetes Operator Framework to create Fabric Network and stand up nodes in a K8s Cluster

The following is the list of the general steps to make the Kubernetes Operator

1. [Create configuration zip](#create-configuration-zip)

## <a name="create-configuration-zip"></a>Create configuration zip

To stand up a fabric network, you will need a set of files, here is the list

   1. K8s configuration file, to get access to a k8s cluster
   2. Config file having the specifications of the K8s resource, as well as the certs needed for that node

The k8s configuration file is needed to gain access to a k8s cluster. Many cloud providers provide the k8s configuration file for you to download once you have a k8s cluster. If not download directly, these providers most likely provides you a way to create such file.

The config file allows you to put in details like node name, allocate k8s resources such as cpu and memory, and the certificates needed for that.

[Download sample config.yaml file](https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/agent/config.yaml)

Follow the below process to prepare for setting up your fabric network:

```
   1. Create a directory named config, any file mentioned must be in this directory
   2. Name your k8s configuration file config and put it in .kube folder
   3. Download the sample config file and change it to put your desired values
   4. Create a zip for the folder with the same name
```

The zip file created in the above process is to be uploaded during the node creation.

## Running the Fabric Operator Manually

To manually run the operator, guide is present here :- [Fabric Operator README](https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/README.md)

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
<img alt="Creative Commons License" style="border-width:0"
src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />
This work is licensed under a
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
Creative Commons Attribution 4.0 International License</a>.
