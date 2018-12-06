apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{clusterName}}
  name: peer1-org2
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
       app: hyperledger
       role: peer
       peer-id: peer1
       org: org2
    spec:
      containers:
      - name: couchdb
        image: hyperledger/fabric-couchdb:0.4.8
        ports:
         - containerPort: 5984
      - name: peer1-org2
        image: hyperledger/fabric-peer:x86_64-1.1.0
        env:
        - name: CORE_PEER_ADDRESSAUTODETECT
          value: "true"
        - name: CORE_LEDGER_STATE_STATEDATABASE
          value: "CouchDB"
        - name: CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS
          value: "localhost:5984"
        - name: CORE_VM_ENDPOINT
          value: "unix:///host/var/run/docker.sock"
        - name: CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE
          value: "bridge"
        #- name: CORE_VM_DOCKER_HOSTCONFIG_DNS
        #  value: "10.100.200.10"
        - name: CORE_LOGGING_LEVEL
          value: "DEBUG"
        - name: CORE_PEER_TLS_CERT_FILE
          value: "/etc/hyperledger/fabric/tls/server.crt"
        - name: CORE_PEER_TLS_KEY_FILE
          value: "/etc/hyperledger/fabric/tls/server.key"
        - name: CORE_PEER_TLS_ROOTCERT_FILE
          value: "/etc/hyperledger/fabric/tls/ca.crt"
        - name: CORE_LOGGING_LEVEL
          value: "DEBUG"
        - name: CORE_PEER_TLS_ENABLED
          value: "true"
        - name: CORE_PEER_GOSSIP_USELEADERELECTION
          value: "true"
        - name: CORE_PEER_GOSSIP_ORGLEADER
          value: "false"
        - name: CORE_PEER_PROFILE_ENABLED
          value: "false"
        - name: CORE_PEER_ID
          value: peer1-org2
        - name: CORE_PEER_ADDRESS
          value: peer1-org2:7051
       # - name: CORE_PEER_CHAINCODELISTENADDRESS
       #   value: peer1-org2:7052
        - name: CORE_PEER_LOCALMSPID
          value: Org2MSP
        - name: CORE_PEER_GOSSIP_EXTERNALENDPOINT
          value: peer1-org2:7051
        - name: CORE_CHAINCODE_PEERADDRESS
          value: peer1-org2:7051
        - name: CORE_CHAINCODE_STARTUPTIMEOUT
          value: "30s"
        - name: CORE_CHAINCODE_LOGGING_LEVEL
          value: "DEBUG"
        workingDir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        ports:
         - containerPort: 7051
         - containerPort: 7052
         - containerPort: 7053
        command: ["/bin/bash", "-c", "--"]
        args: ["sleep 5; peer node start"]
        volumeMounts:
         #- mountPath: /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
         #  name: certificate
         #  subPath: channel-artifacts
         - mountPath: /etc/hyperledger/fabric/msp
           name: certificate
           #subPath: crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp
           subPath: peers/peer1.org2.example.com/msp
         - mountPath: /etc/hyperledger/fabric/tls
           name: certificate
           #subPath: crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/
           subPath: peers/peer1.org2.example.com/tls
         - mountPath: /var/hyperledger/production
           name: certificate
           subPath: peers/peer1.org2.example.com/production
         - mountPath: /host/var/run
           name: run
      volumes:
       - name: certificate
         persistentVolumeClaim:
             claimName: {{clusterName}}-org2-pvc
       - name: run
         hostPath:
           path: /var/run

---
apiVersion: v1
kind: Service
metadata:
   namespace: {{clusterName}}
   name: peer1-org2
spec:
 selector:
   app: hyperledger
   role: peer
   peer-id: peer1
   org: org2
 type: NodePort
 ports:
   - name: externale-listen-endpoint
     protocol: TCP
     port: 7051
     targetPort: 7051
     nodePort: {{externalPort}}

   - name: chaincode-listen
     protocol: TCP
     port: 7052
     targetPort: 7052
     nodePort: {{chaincodePort}}

   - name: listen
     protocol: TCP
     port: 7053
     targetPort: 7053
     nodePort: {{nodePort}}

---
