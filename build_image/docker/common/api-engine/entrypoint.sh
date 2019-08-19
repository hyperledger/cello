#!/usr/bin/env bash

bash /scripts/initial.sh;
holdup -t 120 tcp://${DB_HOST}:${DB_PORT};
if [[ "$RUN_MODE" == "server" ]]; then
  python manage.py makemigrations && python manage.py migrate;
  python manage.py create_user --username ${ADMIN_USERNAME} --password ${ADMIN_PASSWORD} --is_superuser --email ${ADMIN_EMAIL} --role operator
  if [[ "$DEBUG" == "True" ]]; then
    python manage.py runserver 0.0.0.0:8080;
  else
    uwsgi --ini /etc/uwsgi/apps-enabled/server.ini;
  fi
else
  celery -A api_engine worker -l info
fi
