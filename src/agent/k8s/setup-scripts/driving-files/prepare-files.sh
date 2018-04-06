
#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
#This script setup the required files at the /data directory which
# will further be used by Kubernetes manifests to run
# make sure you are sudo while executing

# export PATH=$(pwd)/bin:$PATH
#
# bash byfn.sh -m generate -c businesschannel

rm -rf  orderer/*
rm -rf fabric-peer/peer0-org1/*
rm -rf fabric-peer/peer1-org1/*
rm -rf fabric-peer/peer0-org2/*
rm -rf fabric-peer/peer1-org2/*

cp -r ./channel-artifacts/genesis.block ./orderer/orderer.genesis.block
cp -r ./crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/* ./orderer/

cp -r ./crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/* ./fabric-peer/peer0-org1/
cp -r ./crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/* ./fabric-peer/peer1-org1/
cp -r ./crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/* ./fabric-peer/peer0-org2/
cp -r ./crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/* ./fabric-peer/peer1-org2/

sudo cp -r ../driving-files /data

echo "Files are transferred to /data directory successfully."
