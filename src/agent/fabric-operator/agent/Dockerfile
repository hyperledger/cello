# Dockerfile for hyperledger cello fabirc operator agent
#
# @see https://github.com/hyperledger/cello/tree/master/docs/agents/fabric-operator.md
#
FROM alpine/git AS BUILD

RUN release=$(wget -O - https://storage.googleapis.com/kubernetes-release/release/stable.txt) && \
    wget https://storage.googleapis.com/kubernetes-release/release/${release}/bin/linux/amd64/kubectl -O /kubectl

FROM alpine
RUN apk update && apk add jq gettext curl bash && mkdir /home/app
COPY src/agent/fabric-operator/deploy /home/app
COPY src/agent/fabric-operator/agent /home/app
COPY --from=build /kubectl /usr/local/bin/kubectl
RUN chmod +x /usr/local/bin/kubectl


ENV HOME /home
WORKDIR /home/app
ENV KUBECONFIG /home/.kube/config

CMD bash /home/app/agent_operation.sh
