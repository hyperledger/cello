# Hyperledger Fabric Operator

## Overview

Fabric operator is the kubernetes operator to allow a user to stand up
fabric CA, Orderer and Peer node using kubectl

## Prerequisites

- [kubectl][kubectl_tool] v1.11.3+
- Access to a Kubernetes v1.11.3+ cluster
- A PersistentVolume storage location for each ca, peer, and orderer.

## Getting Started

### [Start up fabric operator](#startup)

```
$ kubectl apply \
  -f https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_ca_crd.yaml?raw=true \
  -f https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_orderer_crd.yaml?raw=true \
  -f https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_peer_crd.yaml?raw=true
```

The command should finish successfully if you see messages like the below:

```
customresourcedefinition.apiextensions.k8s.io/cas.fabric.hyperledger.org created
customresourcedefinition.apiextensions.k8s.io/orderers.fabric.hyperledger.org created
customresourcedefinition.apiextensions.k8s.io/peers.fabric.hyperledger.org created
```
Once the operator crds get created, start up the controller using the following command
```
kubectl apply \
  -f https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/fabric-operator.yaml?raw=true \
  -f https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/operator.yaml?raw=true
```
The above command starts up the fabric operator controller in your default namespace of your k8s cluster. If you try to use
a different namespace, you should download the fabric-operator.yaml file and change the namespace from default to whatever
the namespace that you want to use.

### [Stand up a Fabric CA node](#startupca)

1. Download the [example fabric ca spec file][ca_spec]
```
wget https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_ca_cr.yaml?raw=true -O myca.yaml
```
2. Make changes to the example ca spec file according to your needs. Here are the list of things that you can change in the example ca spec file.
        *. Node name
        *. CA admin user name and password
        *. CA certificates
        *. CA node release, resource allocation, configuration parameters
3. Run the following command to stand up the CA node::
```
kubectl apply -f myca.yaml
```
after few minutes, your CA node should be up running, you can see it status by using the following command:

```
kubectl describe ca
```

To delete the CA node, you can simply do the following command, assume you name your CA ca1st
```
kubectl delete ca ca1st
```

### [Stand up a Fabric Peer node](#standuppeer)

1. Download the [example fabric peer spec file][peer_spec]
```
wget https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_peer_cr.yaml?raw=true -O mypeer.yaml
```
2. Make changes to the example peer spec file according to your needs. Here are the list of things that you can change in the example peer spec file.
        *. Node name
        *. MSP and TLS certs
        *. Peer node release, resource allocation, configuration parameters
3. Run the following command to stand up the Peer node
```
kubectl apply -f mypeer.yaml
```
after few minutes, your Peer node should be up running, you can see it status by using the following command:

```
kubectl describe peer
```
To delete the peer node, you can simply do the following command, assume you named your peer peer1st:
```
kubectl delete peer peer1st
```


### [Stand up a Fabric Orderer node](#standuporderer)

1. Download the [example fabric orderer spec file][orderer_spec]
```
wget https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_orderer_cr.yaml?raw=true -O myorderer.yaml
```
2. Make changes to the example orderer spec file according to your needs. Here are the list of things that you can change in the example orderer spec file.
        *. Node name
        *. MSP and TLS certs
        *. Orderer node release, resource allocation, configuration parameters
3. Run the following command to stand up the Peer node::
```
kubectl apply -f myorderer.yaml
```
after few minutes, your orderer node should be up running, you can see it status by using the following command:

```
kubectl describe orderer
```
To delete the orderer node, you can simply do the following command, assume you name your orderer orderer1st
```
kubectl delete orderer orderer1st
```

[kubectl_tool]:https://kubernetes.io/docs/tasks/tools/install-kubectl/
[operator_spec]:https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/operator.yaml?raw=true
[ca_spec]:https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_ca_cr.yaml?raw=true
[peer_spec]:https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_peer_cr.yaml?raw=true
[orderer_spec]:https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/deploy/crds/fabric_v1alpha1_orderer_cr.yaml?raw=true

## Fabric Operator from the API / Dashboard

To run the operator using the cello API or dashboard follow the instructions here :- [Fabric Operator Agent README](https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/README.md)

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
