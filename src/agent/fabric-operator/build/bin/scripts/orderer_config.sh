
envsubst < /toolset/orderer_configtx.yaml > /var/orderer/configtx.yaml
cd /var/orderer
mkdir -p msp/admincerts msp/cacerts msp/keystore msp/signcerts msp/tlscacerts /var/orderer/tls
cd /certs
cp admincert* /var/orderer/msp/admincerts
cp cacert* /var/orderer/msp/cacerts
cp keystore /var/orderer/msp/keystore/private.key
cp signcert /var/orderer/msp/signcerts/node.pem
cp tlscacert* /var/orderer/msp/tlscacerts
cp cacert0 /var/orderer/tls/ca.crt
cp tlscert /var/orderer/tls/server.crt
cp tlskey /var/orderer/tls/server.key
mkdir -p /var/orderer/production