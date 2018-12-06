
#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

#This is a one step script to delete all the deployment and
#services executed during the execution of the cluster

kubectl delete deployment hyperledger-fabric-ca
kubectl delete deployment hyperledger-fabric-cli
kubectl delete deployment hyperledger-orderer
kubectl delete deployment hyperledger-peer0-org1
kubectl delete deployment hyperledger-peer0-org2
kubectl delete deployment hyperledger-peer1-org1
kubectl delete deployment hyperledger-peer1-org2

kubectl delete svc orderer-service
kubectl delete svc peer0-org1
kubectl delete svc peer1-org1
kubectl delete svc peer0-org2
kubectl delete svc peer1-org2
kubectl delete svc ca

echo "CLUSTER  Down Completed"
