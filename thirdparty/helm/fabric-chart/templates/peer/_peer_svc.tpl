{{- define "peer.service" }}

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
    role: peer
    peer-id: {{ $name }}
    org: {{ $namespace }}
  ports:
    - name: externale-listen-endpoint
      protocol: TCP
      port: 7051
      targetPort: 7051
    - name: chaincode-listen
      protocol: TCP
      port: 7052
      targetPort: 7052
    - name: listen
      protocol: TCP
      port: 7053
      targetPort: 7053

---
{{- end }}