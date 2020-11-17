# https://github.com/yeasy/docker-hyperledger-fabric
#
# Dockerfile for Hyperledger fabric all-in-one development and experiments, including:
# * fabric-peer
# * fabric-orderer
# * fabric-ca
# * cryptogen
# * configtxgen
# * configtxlator
# * gotools

# If you only need quickly deploy a fabric network, please see
# * yeasy/hyperledger-fabric-peer
# * yeasy/hyperledger-fabric-orderer
# * yeasy/hyperledger-fabric-ca

# Workdir is set to $GOPATH/src/github.com/hyperledger/fabric
# Data is stored under /var/hyperledger/production

FROM golang:1.14
LABEL version=2.2.0

# Orderer, peer, ca, operation api
EXPOSE 7050 7051 7054 8443 9443

ENV DEBIAN_FRONTEND noninteractive

# Only useful for this Dockerfile
ENV FABRIC_ROOT=$GOPATH/src/github.com/hyperledger/fabric \
    FABRIC_CA_ROOT=$GOPATH/src/github.com/hyperledger/fabric-ca

# BASE_VERSION is used in metadata.Version as major version
ENV BASE_VERSION=2.2.0

# PROJECT_VERSION is required in core.yaml for fabric-baseos and fabric-ccenv
ENV PROJECT_VERSION=2.2.0
ENV HLF_CA_VERSION=1.4.8

# generic environment (core.yaml) for builder and runtime: builder: $(DOCKER_NS)/fabric-ccenv:$(TWO_DIGIT_VERSION)
ENV DOCKER_NS=hyperledger
ENV TWO_DIGIT_VERSION=2.2

ENV BASE_DOCKER_NS=hyperledger
ENV LD_FLAGS="-X github.com/hyperledger/fabric/common/metadata.Version=${PROJECT_VERSION} \
              -X github.com/hyperledger/fabric/common/metadata.BaseDockerLabel=org.hyperledger.fabric \
              -X github.com/hyperledger/fabric/common/metadata.DockerNamespace=hyperledger \
              -X github.com/hyperledger/fabric/common/metadata.BaseDockerNamespace=hyperledger"

# -X github.com/hyperledger/fabric/common/metadata.Experimental=true \
# -linkmode external -extldflags '-static -lpthread'"

# peer envs. DONOT combine in one line as the former variable won't work on-the-fly
ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric

# peer env
ENV CORE_PEER_MSPCONFIGPATH=$FABRIC_CFG_PATH/msp \
    FABRIC_LOGGING_SPEC=DEBUG

# orderer env
ENV ORDERER_GENERAL_LOCALMSPDIR=$FABRIC_CFG_PATH/msp \
    ORDERER_GENERAL_LISTENADDRESS=0.0.0.0 \
    ORDERER_GENERAL_GENESISPROFILE=TwoOrgsOrdererGenesis

# ca env. ca-server and ca-client will check the following env in order, to get the home cfg path
ENV FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server \
    FABRIC_CA_SERVER_HOME=/etc/hyperledger/fabric-ca-server \
    FABRIC_CA_CLIENT_HOME=/root/.fabric-ca-client \
    CA_CFG_PATH=/etc/hyperledger/fabric-ca

RUN mkdir -p /var/hyperledger/production \
        $GOPATH/src/github.com/hyperledger \
        $FABRIC_CFG_PATH \
        $FABRIC_CFG_PATH/crypto-config \
        $FABRIC_CA_SERVER_HOME \
        $FABRIC_CA_CLIENT_HOME \
        $CA_CFG_PATH \
        /chaincode/input \
        /chaincode/output \
        /var/hyperledger/fabric-ca-server

# Install development dependencies
RUN apt-get update \
        && apt-get install -y apt-utils python-dev \
        && apt-get install -y libsnappy-dev zlib1g-dev libbz2-dev libyaml-dev libltdl-dev libtool \
        && apt-get install -y python-pip \
        && apt-get install -y vim tree jq unzip \
        && pip install behave nose docker-compose \
        && pip install pyinotify \
        && rm -rf /var/cache/apt

# Install yq to update config for fabric-ca
RUN wget -O /go/bin/yq https://github.com/mikefarah/yq/releases/download/2.4.1/yq_linux_amd64 \
        && chmod a+x /go/bin/yq

# install gotools
RUN go get github.com/golang/protobuf/protoc-gen-go \
        && go get github.com/maxbrunsfeld/counterfeiter \
        && go get github.com/axw/gocov/... \
        && go get github.com/AlekSi/gocov-xml \
        && go get golang.org/x/tools/cmd/goimports \
        && go get golang.org/x/lint/golint \
        && go get github.com/estesp/manifest-tool \
        && go get github.com/client9/misspell/cmd/misspell \
        && go get github.com/estesp/manifest-tool \
        && go get github.com/onsi/ginkgo/ginkgo

# Clone the Hyperledger Fabric code and cp sample config files
RUN cd $GOPATH/src/github.com/hyperledger \
        && wget https://github.com/hyperledger/fabric/archive/v${PROJECT_VERSION}.zip \
        && unzip v${PROJECT_VERSION}.zip \
        && rm v${PROJECT_VERSION}.zip \
        && mv fabric-${PROJECT_VERSION} fabric \
	&& echo "*                hard    nofile          65536" >> /etc/security/limits.conf \
        && echo "*                soft    nofile          8192" >> /etc/security/limits.conf \
        && cp -r $FABRIC_ROOT/sampleconfig/* $FABRIC_CFG_PATH/

# Add external fabric chaincode dependencies
RUN go get github.com/hyperledger/fabric-chaincode-go/shim \
        && go get github.com/hyperledger/fabric-protos-go/peer

# Install configtxgen, cryptogen, configtxlator, discover and idemixgen
RUN cd $FABRIC_ROOT/ \
        && CGO_CFLAGS=" " go install -tags "" github.com/hyperledger/fabric/cmd/configtxgen \
        && CGO_CFLAGS=" " go install -tags "" github.com/hyperledger/fabric/cmd/cryptogen \
        && CGO_CFLAGS=" " go install -tags "" github.com/hyperledger/fabric/cmd/configtxlator \
        && CGO_CFLAGS=" " go install -tags "" -ldflags "-X github.com/hyperledger/fabric/cmd/discover/metadata.Version=${PROJECT_VERSION}" github.com/hyperledger/fabric/cmd/discover \
        && CGO_CFLAGS=" " go install -tags "" github.com/hyperledger/fabric/cmd/idemixgen

# Install fabric peer
RUN CGO_CFLAGS=" " go install -tags "" -ldflags "$LD_FLAGS" github.com/hyperledger/fabric/cmd/peer \
        && go clean

# Install fabric orderer
RUN CGO_CFLAGS=" " go install -tags "" -ldflags "$LD_FLAGS" github.com/hyperledger/fabric/cmd/orderer \
        && go clean

#ADD crypto-config $FABRIC_CFG_PATH/crypto-config

# Install fabric-ca
RUN cd $GOPATH/src/github.com/hyperledger \
        && wget https://github.com/hyperledger/fabric-ca/archive/v${HLF_CA_VERSION}.zip \
        && unzip v${HLF_CA_VERSION}.zip \
        && rm v${HLF_CA_VERSION}.zip \
        && mv fabric-ca-${HLF_CA_VERSION} fabric-ca \
# This will install fabric-ca-server and fabric-ca-client into $GOPATH/bin/
        && go install -ldflags "-X github.com/hyperledger/fabric-ca/lib/metadata.Version=$PROJECT_VERSION -linkmode external -extldflags '-static -lpthread'" github.com/hyperledger/fabric-ca/cmd/... \
# Copy example ca and key files
#&& cp $FABRIC_CA_ROOT/images/fabric-ca/payload/*.pem $FABRIC_CA_HOME/ \
        && go clean

# This is useful to debug local code with mapping inside
VOLUME $GOPATH/src/github.com/hyperledger
# The data and config dir, can map external one with -v
VOLUME /var/hyperledger
VOLUME $FABRIC_CFG_PATH
VOLUME $FABRIC_CA_SERVER_HOME
VOLUME $FABRIC_CA_CLIENT_HOME

# Useful scripts for quickly compiling local code
ADD scripts/ /tmp/

# Remove the go pkg files in case polluting debugging env
RUN bash /tmp/clean_pkg.sh

# Temporarily fix the `go list` complain problem, which is required in chaincode packaging, see core/chaincode/platforms/golang/platform.go#GetDepoymentPayload
ENV GOROOT=/usr/local/go

WORKDIR $FABRIC_ROOT

# This is only a workaround for current hard-coded problem when using as fabric-baseimage.
RUN ln -s $GOPATH /opt/gopath

LABEL org.hyperledger.fabric.version=${PROJECT_VERSION}
