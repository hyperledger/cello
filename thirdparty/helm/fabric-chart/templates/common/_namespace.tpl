{{ define "namespace" }}

{{- $name := .name }}

apiVersion: v1
kind: Namespace
metadata:
  name: {{ .name }}

---

{{ end }}