#This script will use the Kubernetes manifests to deploy
#Fabric 1.0 Kubernetes Cluster

kubectl create -f manifests/fabric-1.0/local/ca.yaml
kubectl create -f manifests/fabric-1.0/local/orderer.yaml
kubectl create -f manifests/fabric-1.0/local/peer0.yaml
kubectl create -f manifests/fabric-1.0/local/peer1.yaml
kubectl create -f manifests/fabric-1.0/local/peer2.yaml
kubectl create -f manifests/fabric-1.0/local/peer3.yaml
kubectl create -f manifests/fabric-1.0/local/cli.yaml
