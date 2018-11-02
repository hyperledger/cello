---
apiVersion: v1
kind: PersistentVolume
metadata:
    name: {{clusterName}}-explorer-pv
spec:
    capacity:
       storage: 500Mi
    accessModes:
       - ReadWriteMany
    claimRef:
      namespace: {{clusterName}}
      name: {{clusterName}}-explorer-pvc
    nfs:
      path: /{{clusterName}}/resources/
      server: {{nfsServer}} # change to your nfs server ip here.
---

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
    namespace: {{clusterName}}
    name: {{clusterName}}-explorer-pvc
spec:
   accessModes:
     - ReadWriteMany
   resources:
      requests:
        storage: 10Mi

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
   namespace: {{clusterName}}
   name: fabric-explorer
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      labels:
       app: explorer
    spec:
      containers:
        - name: mysql
          image: mysql:5.7
          ports:
            - containerPort: 3306
          env:
          - name: MYSQL_ROOT_PASSWORD
            value: root
          - name: MYSQL_DATABASE
            value: fabricexplorer
          volumeMounts:
           - mountPath: /docker-entrypoint-initdb.d/fabricexplorer.sql
             name: explorer-resources
             subPath: explorer-artifacts/fabricexplorer.sql

        - name: fabric-explorer
          imagePullPolicy: IfNotPresent
          image: vmware/fabric-explorer:1.0
          command: [ "/bin/bash", "-c", "--" ]
          args: ["sleep 10;node main.js 2>&1"]
          ports:
            - containerPort: 8080
          volumeMounts:
           - mountPath: /blockchain-explorer/config.json
             name: explorer-resources
             subPath: explorer-artifacts/config.json
           - mountPath: /blockchain-explorer/first-network/crypto-config
             name: explorer-resources
             subPath: crypto-config
      volumes:
        - name: explorer-resources
          persistentVolumeClaim:
              claimName: {{clusterName}}-explorer-pvc
---
apiVersion: v1
kind: Service
metadata:
   namespace: {{clusterName}}
   name: {{clusterName}}-fabric-explorer
spec:
   selector:
       app: explorer
   type: NodePort
   ports:
      - name: explorer-server
        protocol: TCP
        port: 8080
        targetPort: 8080
        nodePort: {{nodePort}}
