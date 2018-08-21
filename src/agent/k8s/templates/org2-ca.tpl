apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{clusterName}}
  name: ca-org2
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
       app: hyperledger
       role: ca
       org: org2
       name: ca
    spec:
     containers:
       - name: ca
         image: hyperledger/fabric-ca:amd64-1.2.0
         env:
         - name:  FABRIC_CA_HOME
           value: /etc/hyperledger/fabric-ca-server
         - name:  FABRIC_CA_SERVER_CA_NAME
           value: ca
         - name:  FABRIC_CA_SERVER_TLS_ENABLED
           value: "false"
         - name:  FABRIC_CA_SERVER_TLS_CERTFILE
           value: /etc/hyperledger/fabric-ca-server-config/ca.org2-cert.pem
         - name:  FABRIC_CA_SERVER_TLS_KEYFILE
           value: /etc/hyperledger/fabric-ca-server-config/d1175d4260ee78d808c5e62926d488382181788847374ba7a2516e28210ffa99_sk
         ports:
          - containerPort: 7054
         command: ["sh"]
         args:  ["-c", " fabric-ca-server start --ca.certfile /etc/hyperledger/fabric-ca-server-config/ca.org2-cert.pem --ca.keyfile /etc/hyperledger/fabric-ca-server-config/d1175d4260ee78d808c5e62926d488382181788847374ba7a2516e28210ffa99_sk -b admin:adminpw -d "]
         volumeMounts:
          - mountPath: /etc/hyperledger/fabric-ca-server-config
            name: certificate
            subPath: ca/
          - mountPath: /etc/hyperledger/fabric-ca-server
            name: certificate
            subPath: fabric-ca-server/
     volumes:
       - name: certificate
         persistentVolumeClaim:
             claimName: {{clusterName}}-org2-pvc

---
apiVersion: v1
kind: Service
metadata:
   namespace: {{clusterName}}
   name: ca-org2
spec:
 selector:
   app: hyperledger
   role: ca
   org: org2
   name: ca
 type: NodePort
 ports:
   - name: endpoint
     protocol: TCP
     port: 7054
     targetPort: 7054
     nodePort: {{nodePort}}
