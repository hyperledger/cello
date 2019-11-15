# Dockerfile for hyperledger fabirc kubernetes operator agent
#
# @see https://github.com/hyperledger/cello/blob/master/src/agent/fabric-operator/README.md
#

# Get all necessary source code from github
FROM alpine/git AS downloader
RUN cd /tmp && git init cello && cd cello                           && \
    git remote add origin https://github.com/hyperledger/cello.git  && \
    git config core.sparsecheckout true                             && \
    echo "src/agent/fabric-operator/*" >> .git/info/sparse-checkout && \
    git pull --depth=1 origin master

RUN wget https://storage.googleapis.com/kubernetes-release/release/\
`wget -O - https://storage.googleapis.com/kubernetes-release/release/stable.txt`\
/bin/linux/amd64/kubectl && chmod +x kubectl && \
mv kubectl /usr/local/bin/kubectl && \
apk update && \
apk add jq gettext curl wget bash

ENV HOME /home
COPY --from=downloader /tmp/cello/src/agent/fabric-operator/deploy/ /home/app/deploy
COPY --from=downloader /tmp/cello/src/agent/fabric-operator/agent/ /home/app
WORKDIR /home/app
ENV KUBECONFIG /home/.kube/config

CMD bash /home/app/agent_operation.sh

