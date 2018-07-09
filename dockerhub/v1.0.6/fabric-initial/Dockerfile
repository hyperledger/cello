# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM hyperledger/fabric-tools:x86_64-1.0.6

ENV FABRIC_VERSION 1.0.6

RUN git clone -b v${FABRIC_VERSION} --depth 1 https://github.com/hyperledger/fabric-samples.git && \
    mkdir -p ~/generate-crypto/channel-artifacts && cd fabric-samples/first-network && \
    cp docker-compose-e2e-template.yaml byfn.sh configtx.yaml crypto-config.yaml ~/generate-crypto && \
    sed -i '/ask for confirmation to proceed/,+1 d' ~/generate-crypto/byfn.sh && \
    rm -rf /tmp/*

WORKDIR /root/generate-crypto
ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && mkdir /root/bin && tar -C /root/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz
ENV CHANNEL_NAME mychannel
COPY initial.sh /root/
CMD bash /root/initial.sh
