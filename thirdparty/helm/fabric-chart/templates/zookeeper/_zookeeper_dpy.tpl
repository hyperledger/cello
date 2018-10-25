{{- define "zookeeper.deployment" }}

{{- $namespace := .namespace }}
{{- $name := .name }}
{{- $zooMyID := .zooMyID }}
{{- $zooServers := .zooServers }}

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
        role: zookeeper
        org: {{ $namespace }}
        zookeeper-id: {{ $name }}
    spec:
      containers:
      - name: {{ $name }}
        image: hyperledger/fabric-zookeeper:x86_64-1.0.5
        env:
        - name: ZOO_MY_ID
          value: {{ $zooMyID | quote }}
        - name: ZOO_SERVERS
          value: {{ $zooServers }}
        ports:
         - containerPort: 2181
         - containerPort: 2888
         - containerPort: 3888

---
{{- end }}