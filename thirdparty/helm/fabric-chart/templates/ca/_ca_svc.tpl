{{ define "ca.service" }}

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
   role: ca
   org: {{ $namespace }}
   name: ca
 ports:
   - name: endpoint
     protocol: TCP
     port: 7054
     targetPort: 7054

---
{{ end }}