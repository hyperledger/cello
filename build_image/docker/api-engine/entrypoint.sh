#!/usr/bin/env bash

bash /scripts/initial.sh;
holdup -t 120 tcp://${DB_HOST}:${DB_PORT};
python manage.py makemigrations && python manage.py migrate;
python manage.py create_user --username ${ADMIN_USERNAME} --password ${ADMIN_PASSWORD} --is_superuser --email ${ADMIN_EMAIL} --role operator
uwsgi --ini /etc/uwsgi/apps-enabled/server.ini;
