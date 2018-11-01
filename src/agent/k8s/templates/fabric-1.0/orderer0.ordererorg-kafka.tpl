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
        image: hyperledger/fabric-orderer:x86_64-1.0.5
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
           #subPath: crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp
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

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{clusterName}}
  name: kafka0
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: kafka
        org: kafkacluster
        kafka-id: kafka0
    spec:
      containers:
      - name: kafka0
        image: hyperledger/fabric-kafka:x86_64-1.0.5
        env:
        - name: KAFKA_MESSAGE_MAX_BYTES
          value: "1048576"
        - name: KAFKA_REPLICA_FETCH_MAX_BYTES
          value: "1048576"
        - name: KAFKA_UNCLEAN_LEADER_ELECTION_ENABLE
          value: "false"
        - name: KAFKA_BROKER_ID
          value: "0"
        - name: KAFKA_MIN_INSYNC_REPLICAS
          value: "2"
        - name: KAFKA_DEFAULT_REPLICATION_FACTOR
          value: "3"
        - name: KAFKA_ZOOKEEPER_CONNECT
          value: "zookeeper0:2181,zookeeper1:2181,zookeeper2:2181"
        - name: KAFKA_ZOOKEEPER_CONNECTION_TIMEOUT_MS
          value: "36000"
        - name: KAFKA_ADVERTISED_HOST_NAME
          value: "kafka0"
        ports:
         - containerPort: 9092

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace:  {{clusterName}}
  name: kafka1
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: kafka
        org: kafkacluster
        kafka-id: kafka1
    spec:
      containers:
      - name: kafka1
        image: hyperledger/fabric-kafka:x86_64-1.0.5
        env:
        - name: KAFKA_MESSAGE_MAX_BYTES
          value: "1048576"
        - name: KAFKA_REPLICA_FETCH_MAX_BYTES
          value: "1048576"
        - name: KAFKA_UNCLEAN_LEADER_ELECTION_ENABLE
          value: "false"
        - name: KAFKA_BROKER_ID
          value: "1"
        - name: KAFKA_MIN_INSYNC_REPLICAS
          value: "2"
        - name: KAFKA_DEFAULT_REPLICATION_FACTOR
          value: "3"
        - name: KAFKA_ZOOKEEPER_CONNECT
          value: "zookeeper0:2181,zookeeper1:2181,zookeeper2:2181"
        - name: KAFKA_ZOOKEEPER_CONNECTION_TIMEOUT_MS
          value: "36000"
        - name: KAFKA_ADVERTISED_HOST_NAME
          value: "kafka1"
        ports:
         - containerPort: 9092

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace:  {{clusterName}}
  name: kafka2
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: kafka
        org: kafkacluster
        kafka-id: kafka2
    spec:
      containers:
      - name: kafka2
        image: hyperledger/fabric-kafka:x86_64-1.0.5
        env:
        - name: KAFKA_MESSAGE_MAX_BYTES
          value: "1048576"
        - name: KAFKA_REPLICA_FETCH_MAX_BYTES
          value: "1048576"
        - name: KAFKA_UNCLEAN_LEADER_ELECTION_ENABLE
          value: "false"
        - name: KAFKA_BROKER_ID
          value: "2"
        - name: KAFKA_MIN_INSYNC_REPLICAS
          value: "2"
        - name: KAFKA_DEFAULT_REPLICATION_FACTOR
          value: "3"
        - name: KAFKA_ZOOKEEPER_CONNECT
          value: "zookeeper0:2181,zookeeper1:2181,zookeeper2:2181"
        - name: KAFKA_ZOOKEEPER_CONNECTION_TIMEOUT_MS
          value: "36000"
        - name: KAFKA_ADVERTISED_HOST_NAME
          value: "kafka2"
        ports:
         - containerPort: 9092

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace:  {{clusterName}}
  name: zookeeper0
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: zookeeper
        org: kafkacluster
        zookeeper-id: zookeeper0
    spec:
      containers:
      - name: zookeeper0
        image: hyperledger/fabric-zookeeper:x86_64-1.0.5
        env:
        - name: ZOO_MY_ID
          value: "1"
        - name: ZOO_SERVERS
          value: "server.1=0.0.0.0:2888:3888 server.2=zookeeper1:2888:3888 server.3=zookeeper2:2888:3888"
        ports:
         - containerPort: 2181
         - containerPort: 2888
         - containerPort: 3888

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{clusterName}}
  name: zookeeper1
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: zookeeper
        org: kafkacluster
        zookeeper-id: zookeeper1
    spec:
      containers:
      - name: zookeeper1
        image: hyperledger/fabric-zookeeper:x86_64-1.0.5
        env:
        - name: ZOO_MY_ID
          value: "2"
        - name: ZOO_SERVERS
          value: "server.1=zookeeper0:2888:3888 server.2=0.0.0.0:2888:3888 server.3=zookeeper2:2888:3888"
        ports:
         - containerPort: 2181
         - containerPort: 2888
         - containerPort: 3888

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{clusterName}}
  name: zookeeper2
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
        app: hyperledger
        role: zookeeper
        org: kafkacluster
        zookeeper-id: zookeeper2
    spec:
      containers:
      - name: zookeeper2
        image: hyperledger/fabric-zookeeper:x86_64-1.0.5
        env:
        - name: ZOO_MY_ID
          value: "3"
        - name: ZOO_SERVERS
          value: "server.1=zookeeper0:2888:3888 server.2=zookeeper1:2888:3888 server.3=0.0.0.0:2888:3888"
        ports:
         - containerPort: 2181
         - containerPort: 2888
         - containerPort: 3888

---
apiVersion: v1
kind: Service
metadata:
  namespace: {{clusterName}}
  name: kafka0
spec:
 selector:
   app: hyperledger
   role: kafka
   kafka-id: kafka0
   org: kafkacluster
 clusterIP: None
 ports:
   - name: listen-endpoint
     protocol: TCP
     port: 9092

---
apiVersion: v1
kind: Service
metadata:
  namespace: {{clusterName}}
  name: kafka1
spec:
 selector:
   app: hyperledger
   role: kafka
   kafka-id: kafka1
   org: kafkacluster
 clusterIP: None
 ports:
   - name: listen-endpoint
     protocol: TCP
     port: 9092
---
apiVersion: v1
kind: Service
metadata:
  namespace: {{clusterName}}
  name: kafka2
spec:
 selector:
   app: hyperledger
   role: kafka
   kafka-id: kafka2
   org: kafkacluster
 clusterIP: None
 ports:
   - name: listen-endpoint
     protocol: TCP
     port: 9092

---
apiVersion: v1
kind: Service
metadata:
  namespace: {{clusterName}}
  name: zookeeper0
spec:
 selector:
   app: hyperledger
   role: zookeeper
   zookeeper-id: zookeeper0
   org: kafkacluster
 clusterIP: None
 ports:
   - name: client
     port: 2181
   - name: peer
     port: 2888
   - name: leader-election
     port: 3888
---
apiVersion: v1
kind: Service
metadata:
  namespace: {{clusterName}}
  name: zookeeper1
spec:
 selector:
   app: hyperledger
   role: zookeeper
   zookeeper-id: zookeeper1
   org: kafkacluster
 clusterIP: None
 ports:
   - name: client
     port: 2181
   - name: peer
     port: 2888
   - name: leader-election
     port: 3888

---
apiVersion: v1
kind: Service
metadata:
  namespace: {{clusterName}}
  name: zookeeper2
spec:
 selector:
   app: hyperledger
   role: zookeeper
   zookeeper-id: zookeeper2
   org: kafkacluster
 clusterIP: None
 ports:
   - name: client
     port: 2181
   - name: peer
     port: 2888
   - name: leader-election
     port: 3888

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
