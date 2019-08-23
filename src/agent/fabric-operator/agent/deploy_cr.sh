#!/bin/sh
echo "Starting cr generation"

#Download kubernetes config
source download_config.sh

#Check if the namespace exists
NAMESPACE_EXISTS=`kubectl get namespaces | grep $AGENT_ID`

#Create a namespace if it doesn't exists
if [ -z "$NAMESPACE_EXISTS" ]
then
      kubectl create namespace $AGENT_ID
fi

CURRENT_NAMESPACE=$AGENT_ID

#Set namespace as default for current context
kubectl config set-context --current --namespace=$CURRENT_NAMESPACE

TYPE_OF_NODE=$NODE_TYPE

if [ $TYPE_OF_NODE =  "ca" ]
then
  CR_NAME=fabric-ca-server
  kubectl apply -f deploy/crds/fabric_v1alpha1_ca_crd.yaml
  cat > cr_config.yaml << EOL
apiVersion: fabric.hyperledger.org/v1alpha1
kind: CA
metadata:
  name: $CR_NAME
spec:
  admin: $CA_ADMIN_NAME
  adminPassword: $CA_ADMIN_PASSWORD
  storageSize: "1Gi"
  storageClass: "default"
  image: "hyperledger/fabric-ca:1.4.1"
  hosts: [`jq '.hosts' <<< "$CA_CONFIG"`]
  configParams:
    - name: FABRIC_CA_HOME
      value: "/etc/hyperledger/fabric-ca-server"
    - name: FABRIC_CA_SERVER_HOME
      value: "/etc/hyperledger/fabric-ca-server/crypto"
    - name: FABRIC_CA_SERVER_TLS_ENABLED
      value: "true"
EOL

elif [ $TYPE_OF_NODE = "peer" ]
then
  CR_NAME=peer
  kubectl apply -f deploy/crds/fabric_v1alpha1_peer_crd.yaml
  cat > cr_config.yaml << EOL
apiVersion: fabric.hyperledger.org/v1alpha1
kind: Peer
metadata:
  name: $CR_NAME
spec:
  storageSize: "1Gi"
  storageClass: "default"
  image: "hyperledger/fabric-peer:1.4.1"
  configParams:
    - name: CORE_PEER_ADDRESSAUTODETECT
      value: "true"
    - name: CORE_PEER_NETWORKID
      value: nid1
EOL

elif [ $TYPE_OF_NODE = "orderer" ]
then
  CR_NAME=orderer
  kubectl apply -f deploy/crds/fabric_v1alpha1_orderer_crd.yaml
  cat > cr_config.yaml << EOL
apiVersion: fabric.hyperledger.org/v1alpha1
kind: Orderer
metadata:
  name: $CR_NAME
spec:
  storageSize: "1Gi"
  storageClass: "default"
  image: "hyperledger/fabric-orderer:1.4.1"
  configParams:
    - name: ORDERER_CFG_PATH
      value: /shared/
    - name: ORDERER_GENERAL_LEDGERTYPE
      value: file
EOL
else
  echo "Invalid node type"
  exit 1
fi

#Deploying Operator image
kubectl apply -f deploy/service_account.yaml
kubectl apply -f deploy/role.yaml
kubectl apply -f deploy/role_binding.yaml
kubectl apply -f deploy/operator.yaml

#Creating the Custom Resource
kubectl apply -f cr_config.yaml

#Get Status of pod
STATUS=$(kubectl get pods "$CR_NAME-0" -o json | jq .status.phase )
#Get ports of the service created
PORTS=$(kubectl get svc "name" -o json | jq -r '[.spec.ports[] | { external: .nodePort, internal: .port }]')

#Update node api
curl $NODE_DETAIL_URL -X 'PUT' -H 'Authorization: JWT $TOKEN' -H 'Content-Type: application/json' --data '{"status":"$STATUS","ports":$PORTS}'
