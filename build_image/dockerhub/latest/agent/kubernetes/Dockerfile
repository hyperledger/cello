FROM busybox as downloader

RUN cd /tmp && wget -c https://github.com/hyperledger/cello/archive/master.zip && \
    unzip master.zip

FROM python:3.6

LABEL maintainer="github.com/hyperledger/cello"

COPY --from=downloader /tmp/cello-master/src/agent/kubernetes-agent/requirements.txt /
RUN pip install -r /requirements.txt
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && chmod +x kubectl && \
    mv kubectl /usr/local/bin/kubectl

COPY --from=downloader /tmp/cello-master/src/agent/kubernetes-agent/src /app

WORKDIR /app

ENV KUBECONFIG /app/.kube/config
ENV PYTHONPATH /app:$PATHONPATH

CMD python main.py
