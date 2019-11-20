echo "Getting Kubernetes Agent Config..."

#Get kubernetes config file
wget $AGENT_CONFIG_FILE
CONFIG_FILE=$(basename $AGENT_CONFIG_FILE)
mkdir $HOME/.kube/

if [ ${CONFIG_FILE#*.} = "zip" ]
then
  echo "Extracting the Kubernetes Config File..."
  unzip $CONFIG_FILE -d $HOME/
else
  mv $CONFIG_FILE $HOME/.kube/config
fi

echo "Getting Node Files..."
wget $NODE_FILE_URL
NODE_FILE=$(basename $NODE_FILE_URL)
echo "Extracting Node Files"
tar -xvzf $NODE_FILE
