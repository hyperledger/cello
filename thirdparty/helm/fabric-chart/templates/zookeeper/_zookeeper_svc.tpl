{{- define "zookeeper.service" }}

{{- $namespace := .namespace }}
{{- $name := .name }}

apiVersion: v1
kind: Service
metadata:
  namespace: {{ $namespace }}
  name: {{ $name }}
spec:
 selector:
   app: hyperledger
   role: zookeeper
   zookeeper-id: {{ $name }}
   org: {{ $namespace }}
 clusterIP: None
 ports:
   - name: client
     port: 2181
   - name: peer
     port: 2888
   - name: leader-election
     port: 3888

---
{{- end }}