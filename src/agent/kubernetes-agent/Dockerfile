FROM golang as fabric-binary

RUN go get -u github.com/hyperledger/fabric-ca/cmd/...

FROM python:3.6

COPY requirements.txt /
RUN pip install -r /requirements.txt
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && chmod +x kubectl && \
    mv kubectl /usr/local/bin/kubectl

COPY src /app

COPY --from=fabric-binary /go/bin/fabric-ca-client /usr/local/bin/fabric-ca-client

WORKDIR /app

ENV KUBECONFIG /app/.kube/config
ENV FABRIC_CA_CLIENT_TLS_CERTFILES /tmp/crypto/ca-cert.pem
ENV FABRIC_CA_CLIENT_HOME /tmp/admin
ENV PYTHONPATH /app:$PATHONPATH

CMD python main.py
