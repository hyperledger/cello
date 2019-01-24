#!/usr/bin/env bash

bash /scripts/initial.sh;
holdup -t 120 tcp://${DB_HOST}:${DB_PORT};
python manage.py makemigrations && python manage.py migrate;
uwsgi --ini /etc/uwsgi/apps-enabled/server.ini;
