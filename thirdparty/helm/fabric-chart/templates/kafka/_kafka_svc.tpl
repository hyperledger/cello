{{- define "kafka.service" }}

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
   role: kafka
   kafka-id: {{ $name }}
   org: {{ $namespace }}
 clusterIP: None
 ports:
   - name: listen-endpoint
     protocol: TCP
     port: 9092

---
{{- end }}