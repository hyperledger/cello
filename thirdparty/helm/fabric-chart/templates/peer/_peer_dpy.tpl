{{ define "peer.deployment" }}

{{- $namespace := .namespace }}
{{- $name := .name }}
{{- $orgName := .orgName }}
{{- $orgDomainName := .orgDomainName }}
{{- $pvc := .pvc }}

{{- $peerID := printf "%s.%s" $name $orgDomainName }}
{{- $peerAddr := printf "%s:7051" $name }}
{{- /* function title is used to upper the first char of $name */}}
{{- $localMSPID :=  printf "%sMSP" $orgName }}

apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: {{ $namespace }}
  name:	{{ $name }}
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
       app: hyperledger
       role: peer
       peer-id: {{ $name }}
       org: {{ $namespace }}
    spec:
      containers:
      - name: couchdb
        image: hyperledger/fabric-couchdb:x86_64-1.0.5
        ports:
         - containerPort: 5984
      - name: {{ $name }}
        image: hyperledger/fabric-peer:x86_64-1.0.5
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
          value: "false"
        - name: CORE_PEER_GOSSIP_USELEADERELECTION
          value: "true"
        - name: CORE_PEER_GOSSIP_ORGLEADER
          value: "false"
        - name: CORE_PEER_PROFILE_ENABLED
          value: "false"
        - name: CORE_PEER_ID
          value: {{ $peerID }}
        - name: CORE_PEER_ADDRESS
          value: {{ $peerAddr }}
        - name: CORE_PEER_LOCALMSPID
          value: {{ $localMSPID }}
        - name: CORE_PEER_GOSSIP_EXTERNALENDPOINT
          value: {{ $peerAddr }}
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
         - mountPath: /etc/hyperledger/fabric/msp
           name: certificate
           subPath: peers/{{ $peerID }}/msp
         - mountPath: /etc/hyperledger/fabric/tls
           name: certificate
           subPath: peers/{{ $peerID }}/tls
         - mountPath: /var/hyperledger/production
           name: certificate
           subPath: peers/{{ $peerID }}/production
         - mountPath: /host/var/run
           name: run
      volumes:
       - name: certificate
         persistentVolumeClaim:
             claimName: {{ $pvc }}
       - name: run
         hostPath:
           path: /var/run
---
{{ end }}
