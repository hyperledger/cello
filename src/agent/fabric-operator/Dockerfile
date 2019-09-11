FROM alpine

RUN wget https://storage.googleapis.com/kubernetes-release/release/\
`wget -O - https://storage.googleapis.com/kubernetes-release/release/stable.txt`\
/bin/linux/amd64/kubectl && chmod +x kubectl && \
mv kubectl /usr/local/bin/kubectl && \
apk update && \
apk add jq gettext curl wget bash

ENV HOME /home
COPY deploy/ /home/app/deploy
COPY agent/ /home/app
WORKDIR /home/app
ENV KUBECONFIG /home/.kube/config

CMD bash /home/app/deploy_cr.sh
