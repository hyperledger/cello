FROM ubuntu:xenial

LABEL maintainer="github.com/hyperledger/cello"

WORKDIR /app

COPY install.sh /tmp/

# Install necessary software
RUN cd /tmp/ && \
    bash install.sh && \
		rm -f /tmp/install.sh

# Clone code and put cello/src/* under /app
RUN cd /tmp && \
		git clone https://github.com/hyperledger/cello.git && \
		cd /tmp/cello && \
		git checkout v0.8.0-beta && \
		cp -r /tmp/cello/src/* /app && \
		cd /app/ && \
		pip install -r requirements.txt && \
		rm -rf /tmp/cello
