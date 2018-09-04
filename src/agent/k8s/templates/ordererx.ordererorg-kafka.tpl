---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{clusterName}}
  name: {{ordererId}}-{{organizationId}}
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: orderer
        org: {{organizationId}}
        orderer-id: {{ordererId}}
    spec:
      containers:
      - name: {{ordererId}}-{{organizationId}}
        image: hyperledger/fabric-orderer:amd64-1.2.0
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
          value: "false"
        - name: ORDERER_GENERAL_TLS_PRIVATEKEY
          value: /var/hyperledger/orderer/tls/server.key
        - name: ORDERER_GENERAL_TLS_CERTIFICATE
          value: /var/hyperledger/orderer/tls/server.crt
        - name: ORDERER_GENERAL_TLS_ROOTCAS
          value: '[/var/hyperledger/orderer/tls/ca.crt]'
        - name: ORDERER_KAFKA_RETRY_SHORTINTERVAL
          value: "5s"
        - name: ORDERER_KAFKA_RETRY_SHORTTOTAL
          value: "30s"
        - name: ORDERER_KAFKA_VERBOSE
          value: "true"
        - name: ORDERER_KAFKA_BROKERS
          value: '[kafka0:9092,kafka1:9092,kafka2:9092]'
        workingDir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        ports:
         - containerPort: 7050
        command: ["orderer"]
        volumeMounts:
         - mountPath: /var/hyperledger/orderer/msp
           name: certificate
           #subPath: crypto-config/organizationIds/example.com/orderers/orderer.example.com/msp
           subPath: orderers/{{ordererId}}.{{organizationId}}/msp
         - mountPath: /var/hyperledger/orderer/tls
           name: certificate
           #subPath: crypto-config/organizationIds/example.com/orderers/orderer.example.com/tls/
           subPath: orderers/{{ordererId}}.{{organizationId}}/tls
         - mountPath: /var/hyperledger/orderer/orderer.genesis.block
           name: certificate
           subPath: genesis.block
         - mountPath: /var/hyperledger/production
           name: certificate
           subPath: orderers/{{ordererId}}.{{organizationId}}/production
      volumes:
       - name: certificate
         persistentVolumeClaim:
             claimName: {{clusterName}}-{{organizationId}}-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: {{ordererId}}
  namespace: {{clusterName}}
spec:
 selector:
   app: hyperledger
   role: orderer
   orderer-id: {{ordererId}}
   org: {{organizationId}}
 type: NodePort
 ports:
   - name: listen-endpoint
     protocol: TCP
     port: 7050
     targetPort: 7050
     nodePort: {{nodePort}}
