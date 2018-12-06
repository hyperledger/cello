FROM busybox as downloader

RUN cd /tmp && wget -c https://github.com/hyperledger/cello/archive/master.zip && \
    unzip master.zip

FROM parseplatform/parse-server:3.1.2

LABEL maintainer="github.com/hyperledger/cello"

COPY --from=downloader /tmp/cello-master/src/parse-server/cloud /parse-server/cloud

RUN cd cloud && npm install
