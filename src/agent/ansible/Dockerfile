# Dockerfile for hyperledger cello ansible agent
#
# @see https://github.com/hyperledger/cello/blob/master/docs/worker_ansible_howto.md
#
#   docker build --build-arg user=$USER \
#      --build-arg uid=$(id -u) \
#      --build-arg gid=$(id -g) \
#      -t celloagent .


# pull base image
FROM alpine

MAINTAINER Tong Li <litong01@us.ibm.com>

ARG user=ubuntu
ARG uid=1000
ARG gid=1000

RUN apk --no-cache --update --virtual add bash curl py-pip     \
    ansible ca-certificates gcc python-dev musl-dev openssl    \
    openssh linux-headers sshpass                           && \
    pip install --upgrade pip boto boto3 shade              && \
    addgroup -g ${gid} ${user}                              && \
    adduser -D -u ${uid} -G ${user} ${user}                 && \
    adduser ${user} ping                                    && \
    mkdir -p /opt/agent/.ssh                                && \
    cd /opt/agent/.ssh                                      && \
    echo "host *" > config                                  && \
    echo "  StrictHostKeyChecking no" >> config             && \
    echo "  UserKnownHostsFile /dev/null" >> config         && \
    rm -rf /var/cache/apk/*

ADD https://storage.googleapis.com/kubernetes-release/release/v1.10.2/bin/linux/amd64/kubectl /bin/kubectl
ADD . /opt/agent
RUN ssh-keygen -q -t rsa -N '' -f /opt/agent/vars/fd        && \
    chown -R ${uid}:${gid} /opt/agent                       && \
    chmod 755 /opt/agent/entrypoint.sh bin/kubectl
ENV HOME /opt/agent
ENV WORKDIR /opt/agent
WORKDIR /opt/agent
USER ${user}

ENTRYPOINT ["/opt/agent/entrypoint.sh"]
CMD [ "ansible-playbook", "--version" ]
