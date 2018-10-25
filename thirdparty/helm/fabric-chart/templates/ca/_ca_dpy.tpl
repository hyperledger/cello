{{ define "ca.deployment" }}

{{- $namespace := .namespace }}
{{- $name := .name }}
{{- $pvc := .pvc }}

apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{ $namespace }}
  name: {{ $name }}
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
       app: hyperledger
       role: ca
       org: {{ $namespace }}
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
           value: "false"
         - name:  FABRIC_CA_SERVER_TLS_CERTFILE
           value: /etc/hyperledger/fabric-ca-server-config/ca.{{ $namespace }}-cert.pem
         - name:  FABRIC_CA_SERVER_TLS_KEYFILE
           value: /etc/hyperledger/fabric-ca-server-config/ca.{{ $namespace }}-key.pem
         ports:
          - containerPort: 7054
         command: ["sh"]
         args:  ["-c", " fabric-ca-server start --ca.certfile /etc/hyperledger/fabric-ca-server-config/ca.{{ $namespace }}-cert.pem --ca.keyfile /etc/hyperledger/fabric-ca-server-config/ca.{{ $namespace }}-key.pem -b admin:adminpw -d "]
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
             claimName: {{ $pvc }}

---
{{ end }}
