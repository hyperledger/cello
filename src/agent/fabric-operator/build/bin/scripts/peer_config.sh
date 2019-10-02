
cd /var/peer
mkdir -p msp/admincerts msp/cacerts msp/keystore msp/signcerts msp/tlscacerts /var/peer/tls
cd /certs
cp admincert* /var/peer/msp/admincerts
cp cacert* /var/peer/msp/cacerts
cp keystore /var/peer/msp/keystore/private.key
cp signcert /var/peer/msp/signcerts/node.pem
cp tlscacert* /var/peer/msp/tlscacerts
cp cacert0 /var/peer/tls/ca.crt
cp tlscert /var/peer/tls/server.crt
cp tlskey /var/peer/tls/server.key
mkdir -p /var/peer/production