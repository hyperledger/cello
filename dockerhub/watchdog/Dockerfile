# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM hyperledger/cello-baseimage:x86_64-latest
MAINTAINER Yinxia Zhang <"zhangyinxia@inspur.com">
ENV TZ Asia/Shanghai

WORKDIR /app
COPY ./requirements.txt /app
RUN pip install -r requirements.txt

RUN apt-get install -y wget git-core
RUN cd /tmp && git clone https://github.com/hyperledger/cello.git
RUN cp -r /tmp/cello/src /app

WORKDIR /app/src

# use this in development
CMD ["python", "watchdog.py"]


