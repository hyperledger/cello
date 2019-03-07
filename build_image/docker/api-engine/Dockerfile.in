FROM python:3.6

RUN apt-get update && apt-get install -y gettext-base graphviz && \
	apt-get autoclean && apt-get clean && apt-get autoremove && rm -rf /var/cache/apt/
COPY src/api-engine/requirements.txt /
RUN	cd / && \
	pip install -r requirements.txt

COPY src/api-engine /var/www/server
COPY src/api-engine/docker/uwsgi/server.ini /etc/uwsgi/apps-enabled/
COPY src/api-engine/docker/scripts /scripts
COPY build_image/docker/api-engine/entrypoint.sh /

RUN cd /var/www/server/api_engine && cp settings.py.initial settings.py && cd .. && python manage.py collectstatic --noinput

WORKDIR /var/www/server

CMD bash /entrypoint.sh
