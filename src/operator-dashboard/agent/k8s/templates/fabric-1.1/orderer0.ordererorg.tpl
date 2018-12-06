---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{clusterName}}
  name: orderer0-ordererorg
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: orderer
        org: ordererorg
        orderer-id: orderer0
    spec:
      containers:
      - name: orderer0-ordererorg
        image: hyperledger/fabric-orderer:x86_64-1.1.0
        env:
        - name: ORDERER_GENERAL_LOGLEVEL
          value: debug
        - name: ORDERER_GENERAL_LISTENADDRESS
          value: 0.0.0.0
        - name: ORDERER_GENERAL_GENESISMETHOD
          value: file
        - name: ORDERER_GENERAL_GENESISFILE
          value: /var/hyperledger/orderer/orderer.genesis.block
        - name: ORDERER_GENERAL_LOCALMSPID
          value: OrdererMSP
        - name: ORDERER_GENERAL_LOCALMSPDIR
          value: /var/hyperledger/orderer/msp
        - name: ORDERER_GENERAL_TLS_ENABLED
          value: "true"
        - name: ORDERER_GENERAL_TLS_PRIVATEKEY
          value: /var/hyperledger/orderer/tls/server.key
        - name: ORDERER_GENERAL_TLS_CERTIFICATE
          value: /var/hyperledger/orderer/tls/server.crt
        - name: ORDERER_GENERAL_TLS_ROOTCAS
          value: '[/var/hyperledger/orderer/tls/ca.crt]'
        workingDir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        ports:
         - containerPort: 7050
        command: ["orderer"]
        volumeMounts:
         - mountPath: /var/hyperledger/orderer/msp
           name: certificate
           subPath: orderers/orderer.example.com/msp
         - mountPath: /var/hyperledger/orderer/tls
           name: certificate
           #subPath: crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/
           subPath: orderers/orderer.example.com/tls
         - mountPath: /var/hyperledger/orderer/orderer.genesis.block
           name: certificate
           subPath: orderer.genesis.block
         - mountPath: /var/hyperledger/production
           name: certificate
           subPath: orderers/orderer.example.com/production
      volumes:
       - name: certificate
         persistentVolumeClaim:
             claimName: {{clusterName}}-ordererorg-pvc
         #persistentVolumeClaim:
         #  claimName: nfs


---
apiVersion: v1
kind: Service
metadata:
  name: orderer0
  namespace: {{clusterName}}
spec:
 selector:
   app: hyperledger
   role: orderer
   orderer-id: orderer0
   org: ordererorg
 type: NodePort
 ports:
   - name: listen-endpoint
     protocol: TCP
     port: 7050
     targetPort: 7050
     nodePort: {{nodePort}}
