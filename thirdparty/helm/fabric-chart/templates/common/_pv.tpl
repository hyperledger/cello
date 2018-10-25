{{ define "persistentVolume" }}

{{- $name := .name }}
{{- $nfsServer := .nfsServer }}
{{- $nfsPath := .nfsPath }}
{{- $pvcNamespace := .pvcNamespace }}
{{- $pvcName := .pvcName }}

apiVersion: v1
kind: PersistentVolume
metadata:
  name: {{ $name }}
spec:
  capacity:
    storage: 500Mi
  accessModes:
    - ReadWriteMany
  claimRef:
    namespace: {{ $pvcNamespace }}
    name: {{ $pvcName }}
  nfs:
    path: {{ $nfsPath }}
    server: {{ $nfsServer }}

---

{{ end }}