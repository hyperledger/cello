function __wait-until-pods-created() {
  local period interval i pod

  period="$1"
  interval="$2"
  pod="$3"

  for ((i=0; i<$period; i+=$interval)); do
    STATUS=$(kubectl get pods $pod -o json | jq .status.phase )
    if [[ $STATUS ]]; then
      return 0
    fi

    echo "Waiting for pods to be created..."
    sleep "$interval"
  done

  echo "Waited for $period seconds, but pods are not created yet."
  return 1
}

echo "Creating Node..."

if [ "$NODE_TYPE" =  "ca" ]
then
  CR_NAME="deploy-"${NODE_ID}
  kubectl apply -f deploy/crds/fabric_v1alpha1_ca_crd.yaml
  cat > cr_config.yaml << EOL
apiVersion: fabric.hyperledger.org/v1alpha1
kind: CA
metadata:
  name: $CR_NAME
spec:
  admin: `jq '.admin_name' <<< "$FABRIC_CA_CONFIG"`
  adminPassword: `jq '.admin_password' <<< "$FABRIC_CA_CONFIG"`
  certs:
    cert: `jq '.spec.certs.cert' <<< cat config.json`
    key: `jq '.spec.certs.key' <<< cat config.json`
    tlsCert: `jq '.spec.certs.tlsCert' <<< cat config.json`
    TLSKey: `jq '.spec.certs.tlsKey' <<< cat config.json`
  nodeSpec:
    storageSize: `jq '.spec.nodeSpec.storageSize' <<< cat config.json`
    storageClass: `jq '.spec.nodeSpec.storageClass' <<< cat config.json`
    image: `jq '.spec.nodeSpec.image' <<< cat config.json`
    hosts: [`jq '.hosts' <<< "$FABRIC_CA_CONFIG"`]
    resources:
      requests:
        memory: `jq '.spec.nodeSpec.resources.requests.memory' <<< cat config.json`
        cpu: `jq '.spec.nodeSpec.resources.requests.cpu' <<< cat config.json`
      limits:
        memory: `jq '.spec.nodeSpec.resources.limits.memory' <<< cat config.json`
        cpu: `jq '.spec.nodeSpec.resources.limits.cpu' <<< cat config.json`
    configParams:
`jq -r '.spec.nodeSpec.configParams[] | "      - name: \(.name)\n        value: \"\(.value)\""' config.json`
EOL

elif [ "$NODE_TYPE" = "peer" ]
then
  CR_NAME="deploy-"${NODE_ID}
  kubectl apply -f deploy/crds/fabric_v1alpha1_peer_crd.yaml
  cat > cr_config.yaml << EOL
apiVersion: fabric.hyperledger.org/v1alpha1
kind: Peer
metadata:
  name: $CR_NAME
spec:
  msp:
    adminCerts: `jq -c '.spec.msp.adminCerts' <<< cat config.json`
    caCerts: `jq -c '.spec.msp.caCerts' <<< cat config.json`
    keyStore: `jq -c '.spec.msp.keyStore' <<< cat config.json`
    signCerts: `jq -c '.spec.msp.signCerts' <<< cat config.json`
    tlsCacerts: `jq -c '.spec.msp.tlsCacerts' <<< cat config.json`
  tls:
    tlsCert: `jq -c '.spec.tls.tlsCert' <<< cat config.json`
    tlsKey: `jq -c '.spec.tls.tlsKey' <<< cat config.json`
  nodeSpec:
    storageSize: `jq '.spec.nodeSpec.storageSize' <<< cat config.json`
    storageClass: `jq '.spec.nodeSpec.storageClass' <<< cat config.json`
    image: `jq '.spec.nodeSpec.image' <<< cat config.json `
    hosts: [`jq '.hosts' <<< "$FABRIC_CA_CONFIG"`]
    resources:
      requests:
        memory: `jq '.spec.nodeSpec.resources.requests.memory' <<< cat config.json`
        cpu: `jq '.spec.nodeSpec.resources.requests.cpu' <<< cat config.json`
      limits:
        memory: `jq '.spec.nodeSpec.resources.limits.memory' <<< cat config.json`
        cpu: `jq '.spec.nodeSpec.resources.limits.cpu' <<< cat config.json`
    configParams:
`jq -r '.spec.nodeSpec.configParams[] | "      - name: \(.name)\n        value: \"\(.value)\""' config.json`
EOL

elif [ "$NODE_TYPE" = "orderer" ]
then
  CR_NAME="deploy-"${NODE_ID}
  kubectl apply -f deploy/crds/fabric_v1alpha1_orderer_crd.yaml
  cat > cr_config.yaml << EOL
apiVersion: fabric.hyperledger.org/v1alpha1
kind: Orderer
metadata:
  name: $CR_NAME
  spec:
    msp:
      adminCerts: `jq '.spec.msp.adminCerts' <<< cat config.json`
      caCerts: `jq '.spec.msp.caCerts' <<< cat config.json`
      keyStore: `jq '.spec.msp.keyStore' <<< cat config.json`
      signCerts: `jq '.spec.msp.signCerts' <<< cat config.json`
      tlsCacerts: `jq '.spec.msp.tlsCacerts' <<< cat config.json`
    tls:
      tlsCert: `jq '.spec.tls.tlsCert' <<< cat config.json`
      tlsKey: `jq '.spec.tls.tlsKey' <<< cat config.json`
    nodeSpec:
      storageSize: `jq '.spec.nodeSpec.storageSize' <<< cat config.json`
      storageClass: `jq '.spec.nodeSpec.storageClass' <<< cat config.json`
      image: `jq '.spec.nodeSpec.image' <<< cat config.json `
      hosts: [`jq '.hosts' <<< "$FABRIC_CA_CONFIG"`]
      resources:
        requests:
          memory: `jq '.spec.nodeSpec.resources.requests.memory' <<< cat config.json`
          cpu: `jq '.spec.nodeSpec.resources.requests.cpu' <<< cat config.json`
        limits:
          memory: `jq '.spec.nodeSpec.resources.limits.memory' <<< cat config.json`
          cpu: `jq '.spec.nodeSpec.resources.limits.cpu' <<< cat config.json`
      configParams:
  `jq -r '.spec.nodeSpec.configParams[] | "      - name: \(.name)\n        value: \"\(.value)\""' config.json`
EOL
else
  echo "Node Type Sent is Invalid/Not Supported"
  exit 1
fi

#Deploying Operator image
kubectl apply -f deploy/operator.yaml
kubectl apply -f deploy/fabric-operator.yaml

#Creating the Custom Resource
kubectl apply -f cr_config.yaml

STATUS="Pending"
NODE_STATUS="deploying"

# Waiting for the Pods to be created
__wait-until-pods-created 20 3 "$CR_NAME-0"

if [ "$STATUS" = "\"Pending\"" ]; then
  NODE_STATUS="deploying"
elif [ "$STATUS" = "\"Running\"" ]; then
  NODE_STATUS="running"
fi

#Get ports of the service created
PORTS=$(kubectl get svc $CR_NAME -o json | jq -r '[.spec.ports[] | { external: .nodePort, internal: .port }]')

#Update node api
echo "Updating the Node Status in the API Backend"
curl $NODE_DETAIL_URL -X "PUT" -H "Authorization: JWT ${TOKEN}" -H 'Content-Type: application/json' -H "accept: application/json" -d "{ \"status\": \"$NODE_STATUS\", \"ports\": ${PORTS} }"
