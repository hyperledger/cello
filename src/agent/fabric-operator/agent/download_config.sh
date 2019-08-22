#!/bin/bash
echo "Getting Kubernetes Agent Config"

#Get kubernetes config file
wget $AGENT_CONFIG_FILE -P /tmp
CONFIG_FILE=$(basename $AGENT_CONFIG_FILE)
if [ ${file: -4} == ".zip" ]
then
  unzip $CONFIG_FILE -d /app
else
  mkdir /app/.kube && mv $CONFIG_FILE /app/.kube/
fi