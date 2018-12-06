#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

source $(dirname "$0")/env.sh

# Wait for setup to complete sucessfully
awaitSetup
set -e


# Enroll to get orderer's TLS cert (using the "tls" profile)
fabric-ca-client enroll -d --enrollment.profile tls -u $ENROLLMENT_URL -M /tmp/tls --csr.hosts $ORDERER_HOST

# Copy the TLS key and cert to the appropriate place
TLSDIR=$ORDERER_HOME/tls
mkdir -p $TLSDIR
cp /tmp/tls/keystore/* $ORDERER_GENERAL_TLS_PRIVATEKEY
cp /tmp/tls/signcerts/* $ORDERER_GENERAL_TLS_CERTIFICATE
mkdir -p /data/orgs/orderer/orderer/tls
cp $ORDERER_GENERAL_TLS_PRIVATEKEY /data/orgs/orderer/orderer/tls/server.key
cp $ORDERER_GENERAL_TLS_CERTIFICATE /data/orgs/orderer/orderer/tls/server.crt
cp /data/orderer-ca-cert.pem /data/orgs/orderer/orderer/tls/ca.crt
rm -rf /tmp/tls

# Enroll again to get the orderer's enrollment certificate (default profile)
fabric-ca-client enroll -d -u $ENROLLMENT_URL -M $ORDERER_GENERAL_LOCALMSPDIR
mv /var/hyperledger/orderer/msp/cacerts/* /var/hyperledger/orderer/msp/cacerts/ca.orderer.example.com-cert.pem

# Finish setting up the local MSP for the orderer
finishMSPSetup $ORDERER_GENERAL_LOCALMSPDIR
copyAdminCert $ORDERER_GENERAL_LOCALMSPDIR
mkdir -p /data/orgs/orderer/orderer/msp
cp -r /var/hyperledger/orderer/msp /data/orgs/orderer/orderer

# Wait for the genesis block to be created
#dowait "genesis block to be created" 60 $SETUP_LOGFILE $ORDERER_GENERAL_GENESISFILE

# Start the orderer
#env | grep ORDERER
#orderer
