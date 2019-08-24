echo "Getting Kubernetes Agent Config"

#Get kubernetes config file
wget $AGENT_CONFIG_FILE -P /tmp
CONFIG_FILE=$(basename $AGENT_CONFIG_FILE)
mkdir $HOME/.kube/

if [ ${CONFIG_FILE#*.} = "zip" ]
then
  unzip /tmp/$CONFIG_FILE -d $HOME/.kube
else
  mv /tmp/$CONFIG_FILE $HOME/.kube/config
fi