
#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

#Exposing the Kube-DNS to NodePort 30053
kubectl apply -f manifests/Kube-DNS/kube-dns-nodeport.yaml

#GETTING THE NGINX STREAM PROXY READY TO FORWARD THE INCOMING UDP REQUESTS
#AT PORT 53 TO Kube-DNS NodePort 30053
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

echo "Kube-DNS  and Nginx Proxy are all set"

echo "Now Deploying the Fabric-1.0 cluster"

bash deploy.sh
