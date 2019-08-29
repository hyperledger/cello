# Dockerfile for hyperledger cello ansible agent
#
# @see https://github.com/hyperledger/cello/blob/master/docs/worker_ansible_howto.md
#
FROM alpine/git AS BUILD

RUN cd /tmp && git init cello && cd cello                          && \
    git remote add origin https://github.com/hyperledger/cello.git && \
    git config core.sparsecheckout true                            && \
    echo "src/agent/ansible/*" >> .git/info/sparse-checkout        && \
    git pull --depth=1 origin master

FROM ubuntu:xenial

MAINTAINER Tong Li <litong01@us.ibm.com>

ARG user=ubuntu
ARG uid=1000
ARG gid=1000

RUN apt-get update                                                 && \
    apt-get install -y bash python-pip sudo                        && \
    pip install --upgrade pip ansible pyyaml                       && \
    groupadd -g ${gid} ${user}                                     && \
    useradd -d /opt/agent -u ${uid} -g ${user} ${user}             && \
    usermod -a -G root ${user}                                     && \
    echo "${user} ALL=(ALL) NOPASSWD: ALL"|tee /etc/sudoers.d/${user} && \
    mkdir -p /opt/agent/.ssh                                       && \
    cd /opt/agent/.ssh                                             && \
    echo "host *" > config                                         && \
    echo "  StrictHostKeyChecking no" >> config                    && \
    echo "  UserKnownHostsFile /dev/null" >> config

COPY --from=build /tmp/cello/src/agent/ansible /opt/agent
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    mv kubectl /usr/local/bin/kubectl
RUN chown -R ${uid}:${gid} /opt/agent                              && \
    chmod 755 /usr/local/bin/kubectl

ENV HOME /opt/agent
ENV WORKDIR /opt/agent
WORKDIR /opt/agent
USER ${user}

CMD [ "ansible-playbook", "--version" ]
