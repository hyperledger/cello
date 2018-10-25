{{ define "orderer.service" }}

{{- $namespace := .namespace }}
{{- $name := .name }}

apiVersion: v1
kind: Service
metadata:
  name: {{ $name }}
  namespace: {{ $namespace }}
spec:
 selector:
   app: hyperledger
   role: orderer
   orderer-id: {{ $name }}
   org: {{ $namespace }}
 ports:
   - name: listen-endpoint
     protocol: TCP
     port: 7050
     targetPort: 7050

---

{{ end }}