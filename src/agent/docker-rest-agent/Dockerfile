FROM python:3.8

COPY requirements.txt /
COPY pip /root/.pip

RUN pip install -r /requirements.txt

COPY src /var/www/server
COPY entrypoint.sh /
COPY uwsgi/server.ini /etc/uwsgi/apps-enabled/
RUN mkdir /var/log/supervisor

ENV WEBROOT /
ENV WEB_CONCURRENCY 10
ENV DEBUG False
ENV UWSGI_WORKERS 1
ENV UWSGI_PROCESSES 1
ENV UWSGI_OFFLOAD_THREADS 10
ENV UWSGI_MODULE server.wsgi:application

WORKDIR /var/www/server
RUN python manage.py collectstatic --noinput

CMD bash /entrypoint.sh
