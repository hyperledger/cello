{{ define "cli.deployment" }}

{{- $namespace := .namespace }}
{{- $name := .name }}
{{- $orgName := .orgName }}
{{- $orgDomainName := .orgDomainName }}
{{- $sharedPVC := .sharedPVC }}
{{- $cliPVC := .cliPVC }}

{{- /* function title is used to upper the first char of $name */}}
{{- $localMSPID :=  printf "%sMSP" $orgName }}
{{- $peerAddr := "peer0:7051" }}

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
       app: cli
    spec:
      containers:
        - name: {{ $name }}
          image:  hyperledger/fabric-tools:x86_64-1.0.5
          env:
          - name: CORE_PEER_TLS_ENABLED
            value: "false"
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
            value: {{ $name }}
          - name: CORE_PEER_ADDRESS
            value: {{ $peerAddr }}
          - name: CORE_PEER_LOCALMSPID
            value: {{ $localMSPID }}
          - name: CORE_PEER_MSPCONFIGPATH
            value: /etc/hyperledger/fabric/msp
          workingDir: /opt/gopath/src/github.com/hyperledger/fabric/peer
          command: [ "/bin/bash", "-c", "--" ]
          args: [ "while true; do sleep 30; done;" ]
          volumeMounts:
           - mountPath: /host/var/run/
             name: run
          # when enable tls , should mount orderer tls ca
           - mountPath: /etc/hyperledger/fabric/msp
             name: certificate
             subPath: users/Admin@{{ $orgDomainName }}/msp
           - mountPath: /etc/hyperledger/fabric/tls
             name: certificate
             subPath: users/Admin@{{ $orgDomainName }}/tls
           - mountPath: /opt/gopath/src/github.com/hyperledger/fabric/peer/resources/chaincodes
             name: resources
             subPath: chaincodes
           - mountPath: /opt/gopath/src/github.com/hyperledger/fabric/peer/resources/channel-artifacts
             name: resources
             subPath: channel-artifacts
           - mountPath: /opt/gopath/src/github.com/hyperledger/fabric/peer/resources/scripts
             name: resources
             subPath: scripts
           - mountPath: /etc/hyperledger/ordererOrganizations
             name: resources
             subPath: crypto-config/ordererOrganizations
      volumes:
        - name: certificate
          persistentVolumeClaim:
              claimName: {{ $sharedPVC }}
        - name: resources
          persistentVolumeClaim:
              claimName: {{ $cliPVC }}
        - name: run
          hostPath:
            path: /var/run

---
{{ end }}
