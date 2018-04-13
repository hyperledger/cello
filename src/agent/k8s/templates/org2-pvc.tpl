---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: {{clusterName}}-org2-pv
spec:
  capacity:
    storage: 500Mi
  accessModes:
    - ReadWriteMany
  nfs:
    path: /opt/share/{{clusterName}}/resources/crypto-config/peerOrganizations/org2
    server: {{nfsServer}}  #change to your nfs server ip here

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
 namespace: {{clusterName}}
 name: {{clusterName}}-org2-pv
spec:
 accessModes:
   - ReadWriteMany
 resources:
   requests:
     storage: 10Mi

---
