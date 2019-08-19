FROM busybox as downloader

RUN cd /tmp && wget -c https://github.com/hyperledger/cello/archive/master.zip && \
    unzip master.zip

FROM python:3.6

LABEL maintainer="github.com/hyperledger/cello"

RUN apt-get update && apt-get install -y gettext-base graphviz libgraphviz-dev && \
	apt-get autoclean && apt-get clean && apt-get autoremove && rm -rf /var/cache/apt/
COPY --from=downloader /tmp/cello-master/src/api-engine/requirements.txt /
RUN	cd / && \
	pip install -r requirements.txt

COPY --from=downloader /tmp/cello-master/src/api-engine /var/www/server
COPY --from=downloader /tmp/cello-master/src/api-engine/docker/uwsgi/server.ini /etc/uwsgi/apps-enabled/
COPY --from=downloader /tmp/cello-master/src/api-engine/docker/scripts /scripts
COPY --from=downloader /tmp/cello-master/build_image/docker/common/api-engine/entrypoint.sh /

RUN cd /var/www/server/api_engine && cp settings.py.initial settings.py && cd .. && python manage.py collectstatic --noinput

WORKDIR /var/www/server

ENV RUN_MODE server

CMD bash /entrypoint.sh
