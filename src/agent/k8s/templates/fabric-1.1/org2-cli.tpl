apiVersion: v1
kind: PersistentVolume
metadata:
    name: {{clusterName}}-org2-resources-pv
spec:
    capacity:
       storage: 500Mi
    accessModes:
       - ReadWriteMany
    claimRef:
      namespace: {{clusterName}}
      name: {{clusterName}}-org2-resources-pvc
    nfs:
      path: /{{clusterName}}/resources
      server: {{nfsServer}} # change to your nfs server ip here.
---

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
    namespace: {{clusterName}}
    name: {{clusterName}}-org2-resources-pvc
spec:
   accessModes:
     - ReadWriteMany
   resources:
      requests:
        storage: 10Mi

---

apiVersion: extensions/v1beta1
kind: Deployment
metadata:
   namespace: {{clusterName}}
   name: cli-org2
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
       app: cli
    spec:
      containers:
        - name: cli
          image:  hyperledger/fabric-tools:x86_64-1.1.0
          env:
          - name: CORE_PEER_TLS_ENABLED
            value: "true"
          - name: CORE_PEER_TLS_CERT_FILE
            value: /etc/hyperledger/fabric/tls/server.crt
          - name: CORE_PEER_TLS_KEY_FILE
            value: /etc/hyperledger/fabric/tls/server.key
          - name: CORE_PEER_TLS_ROOTCERT_FILE
            value: /etc/hyperledger/fabric/tls/ca.crt
          - name: CORE_VM_ENDPOINT
            value: unix:///host/var/run/docker.sock
          - name: GOPATH
            value: /opt/gopath
          - name: CORE_LOGGING_LEVEL
            value: DEBUG
          - name: CORE_PEER_ID
            value: cli
          - name: CORE_PEER_ADDRESS
            value: peer0-org2:7051
          - name: CORE_PEER_LOCALMSPID
            value: Org2MSP
          - name: CORE_PEER_MSPCONFIGPATH
            value: /etc/hyperledger/fabric/msp
          - name: ORDERER_CA
            value: /etc/hyperledger/fabric/tls/tlsca.example.com-cert.pem
          workingDir: /opt/gopath/src/github.com/hyperledger/fabric/peer
          command: [ "/bin/bash", "-c", "--" ]
          args: [ "while true; do sleep 30; done;" ]
          volumeMounts:
           - mountPath: /host/var/run/
             name: run
          # when enable tls , should mount orderer tls ca
           - mountPath: /etc/hyperledger/fabric/msp
             name: certificate
             subPath: users/Admin@org2.example.com/msp
           - mountPath: /etc/hyperledger/fabric/tls
             name: certificate
             subPath: users/Admin@org2.example.com/tls
           - mountPath: /opt/gopath/src/github.com/hyperledger/fabric/peer/resources/chaincodes
             name: resources
             subPath: chaincodes
           - mountPath: /opt/gopath/src/github.com/hyperledger/fabric/peer/resources/channel-artifacts
             name: resources
             subPath: channel-artifacts
      volumes:
        - name: certificate
          persistentVolumeClaim:
              claimName: {{clusterName}}-org2-pvc
        - name: resources
          persistentVolumeClaim:
              claimName: {{clusterName}}-org2-resources-pvc
        - name: run
          hostPath:
            path: /var/run
