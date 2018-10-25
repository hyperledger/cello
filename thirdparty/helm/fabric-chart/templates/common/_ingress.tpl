{{- define "ingress" }}

{{- $namespace := .namespace}}
{{- $name := .name }}
{{- $path := .path }}
{{- $backendServiceName := .backendServiceName }}
{{- $backendServicePort := .backendServicePort }}

apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: {{ $name }}
  namespace: {{ $namespace }}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - http:
      paths:
      - path: {{ $path }}
        backend:
          serviceName: {{ $backendServiceName }}
          servicePort: {{ $backendServicePort }}

---
{{- end }}