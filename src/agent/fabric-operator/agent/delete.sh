echo "Deleting Node"

TYPE_OF_NODE=$NODE_TYPE

if [ $TYPE_OF_NODE =  "ca" ]
then
  CR_NAME="deploy-"${NODE_ID}
  kubectl delete ca $CR_NAME
elif [ $TYPE_OF_NODE = "peer" ]
then
  CR_NAME="deploy-"${NODE_ID}
  kubectl delete peer $CR_NAME
elif [ $TYPE_OF_NODE = "orderer" ]
then
  CR_NAME="deploy-"${NODE_ID}
  kubectl delete orderer $CR_NAME
else
  echo "Invalid node type"
  exit 1
fi

#Get Status of pod
STATUS=$(kubectl get pods "$CR_NAME-0" -o json | jq .status.phase )
#Get ports of the service created
PORTS=$(kubectl get svc "$CR_NAME" -o json | jq -r '[.spec.ports[] | { external: .nodePort, internal: .port }]')

#Update node api
curl $NODE_DETAIL_URL -X 'PUT' -H 'Authorization: JWT $TOKEN' -H 'Content-Type: application/json' --data '{"status":"$STATUS","ports":$PORTS}'
