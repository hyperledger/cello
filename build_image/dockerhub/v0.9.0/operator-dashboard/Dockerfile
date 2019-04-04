# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:8.9 as build_js
MAINTAINER Hyperledger Cello "github.com/hyperledger/cello"
RUN cd /tmp && git clone -b 'v0.9.0' --single-branch --depth 1 https://github.com/hyperledger/cello.git

# Fix npm building problem
COPY Fix-operator-user-dashboard-build-image-failed.patch /tmp/cello
RUN cd /tmp/cello && git apply Fix-operator-user-dashboard-build-image-failed.patch

RUN cp -r /tmp/cello/src/static /var/www
RUN cd /var/www/dashboard && npm install && npm run build

FROM hyperledger/cello-baseimage:x86_64-0.9.0

COPY --from=build_js /var/www/dist /app/static/dist
COPY --from=build_js /tmp/cello/src/celery.conf /etc/supervisor/conf.d/
CMD /etc/init.d/supervisor start && if [ "$DEBUG" = "True" ]; then python dashboard.py ; else gunicorn -w 1 --worker-class eventlet -b 0.0.0.0:8080 dashboard:app ;fi
