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
         image: hyperledger/fabric-ca:x86_64-1.0.5
         env:
         - name:  FABRIC_CA_HOME
           value: /etc/hyperledger/fabric-ca-server
         - name:  FABRIC_CA_SERVER_CA_NAME
           value: ca
         - name:  FABRIC_CA_SERVER_TLS_ENABLED
           value: "true"
         - name:  FABRIC_CA_SERVER_TLS_CERTFILE
           value: /etc/hyperledger/fabric-ca-server-config/ca.org2.example.com-cert.pem
         - name:  FABRIC_CA_SERVER_TLS_KEYFILE
           value: /etc/hyperledger/fabric-ca-server-config/a7d47efa46a6ba07730c850fed2c1375df27360d7227f48cdc2f80e505678005_sk
         ports:
          - containerPort: 7054
         command: ["sh"]
         args:  ["-c", " fabric-ca-server start --ca.certfile /etc/hyperledger/fabric-ca-server-config/ca.org2.example.com-cert.pem --ca.keyfile /etc/hyperledger/fabric-ca-server-config/a7d47efa46a6ba07730c850fed2c1375df27360d7227f48cdc2f80e505678005_sk -b admin:adminpw -d "]
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
