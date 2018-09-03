FROM busybox as downloader

RUN cd /tmp && wget -c https://github.com/hyperledger/cello/archive/v0.9.0.zip && \
    unzip v0.9.0.zip && mv cello-0.9.0 cello

FROM python:3.6

LABEL maintainer="github.com/hyperledger/cello"

WORKDIR /app

COPY install.sh /tmp/

# Install necessary software
RUN cd /tmp/ && \
    bash install.sh && \
		rm -f /tmp/install.sh

COPY --from=downloader /tmp/cello/src /app
RUN cd /app/ && \
		pip install -r requirements.txt
