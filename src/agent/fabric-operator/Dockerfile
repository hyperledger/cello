FROM alpine

RUN wget https://storage.googleapis.com/kubernetes-release/release/\
`wget -O - https://storage.googleapis.com/kubernetes-release/release/stable.txt`\
/bin/linux/amd64/kubectl && chmod +x kubectl && \
mv kubectl /usr/local/bin/kubectl && \
apk update && \
apk add jq gettext curl

COPY deploy/ /app/deploy
COPY agent/ /app

WORKDIR /app

ENV KUBECONFIG /app/.kube/config

CMD sh /app/deploy_cr.sh
