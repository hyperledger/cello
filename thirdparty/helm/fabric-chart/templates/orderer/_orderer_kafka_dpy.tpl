{{- define "orderer.kafka.deployment" }}

{{- $namespace := .namespace }}
{{- $name := .name }}
{{- $orgName := .orgName }}
{{- $orgDomainName := .orgDomainName}}
{{- $pvc := .pvc }}
{{- $kafkaBrokers := .kafkaBrokers }}

{{- /* function title is used to upper the first char of $name */}}
{{- $localMSPID := "OrdererMSP" }}
{{- $ordererID := printf "%s.%s" $name $orgDomainName }}
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
        role: orderer
        org: {{ $namespace }}
        orderer-id: {{ $name }}
    spec:
      containers:
      - name: {{ $name }}
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
          value: {{ $localMSPID }}
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
          value: {{ $kafkaBrokers | quote }}
        workingDir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        ports:
         - containerPort: 7050
        command: ["/bin/bash", "-c", "--"]
        args: ["sleep 15; orderer"]
        volumeMounts:
         - mountPath: /var/hyperledger/orderer/msp
           name: certificate
           subPath: orderers/{{ $ordererID }}/msp
         - mountPath: /var/hyperledger/orderer/tls
           name: certificate
           subPath: orderers/{{ $ordererID }}/tls
         - mountPath: /var/hyperledger/orderer/orderer.genesis.block
           name: certificate
           subPath: orderers/orderer.genesis.block
         - mountPath: /var/hyperledger/production
           name: certificate
           subPath: orderers/{{ $ordererID }}/production
      volumes:
       - name: certificate
         persistentVolumeClaim:
             claimName: {{ $pvc }}

---
{{- end }}
