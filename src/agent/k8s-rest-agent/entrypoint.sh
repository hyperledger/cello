#!/usr/bin/env bash

if [[ "$RUN_TYPE" == "SERVER" ]]; then
  uwsgi --ini /etc/uwsgi/apps-enabled/server.ini;
else
  if [[ "$RUN_TYPE" == "TASK" ]]; then
    celery -A server worker --autoscale=20,6 -l info
  elif [[ "$RUN_TYPE" == "BEAT_TASK" ]]; then
    celery -A server beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler --pidfile=/opt/celeryd.pid
  fi
fi
