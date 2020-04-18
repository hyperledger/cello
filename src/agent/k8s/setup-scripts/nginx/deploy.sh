#!/usr/bin/env bash
#This script will use the Kubernetes manifests to deploy
#Fabric 1.0 Kubernetes Cluster

kubectl create -f manifests/fabric-1.0/ca.yaml
kubectl create -f manifests/fabric-1.0/orderer.yaml
kubectl create -f manifests/fabric-1.0/peer0.yaml
kubectl create -f manifests/fabric-1.0/peer1.yaml
kubectl create -f manifests/fabric-1.0/peer2.yaml
kubectl create -f manifests/fabric-1.0/peer3.yaml
kubectl create -f manifests/fabric-1.0/cli.yaml
