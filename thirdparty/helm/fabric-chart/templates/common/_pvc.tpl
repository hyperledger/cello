{{ define "persistentVolumeClaim" }}

{{- $namespace := .namespace }}
{{- $name := .name}}

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
 namespace: {{ $namespace }}
 name: {{ $name }}
spec:
 accessModes:
   - ReadWriteMany
 resources:
   requests:
     storage: 10Mi

---

{{ end }}