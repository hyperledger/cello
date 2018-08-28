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
  claimRef:
    namespace: {{clusterName}}
    name: {{clusterName}}-org2-pvc
  nfs:
    path: /{{clusterName}}/resources/crypto-config/peerOrganizations/org2.example.com
    server: {{nfsServer}}  #change to your nfs server ip here

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
 namespace: {{clusterName}}
 name: {{clusterName}}-org2-pvc
spec:
 accessModes:
   - ReadWriteMany
 resources:
   requests:
     storage: 10Mi

---
