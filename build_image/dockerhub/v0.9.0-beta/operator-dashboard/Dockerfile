# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:8.9 as build_js
MAINTAINER haitao yue "hightall@me.com"
RUN cd /tmp && git clone -b 'v0.9.0-beta' --single-branch --depth 1 https://github.com/hyperledger/cello.git
RUN cp -r /tmp/cello/src/static /var/www
RUN cd /var/www/dashboard && npm install && npm run build

FROM hyperledger/cello-baseimage:x86_64-0.9.0-beta

COPY --from=build_js /var/www/dist /app/static/dist
COPY --from=build_js /tmp/cello/src/celery.conf /etc/supervisor/conf.d/
CMD /etc/init.d/supervisor start && if [ "$DEBUG" = "True" ]; then python dashboard.py ; else gunicorn -w 1 --worker-class eventlet -b 0.0.0.0:8080 dashboard:app ;fi
