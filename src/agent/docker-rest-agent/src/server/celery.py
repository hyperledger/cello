from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# set the default Django settings module for the 'celery' program.
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

app = Celery("server")

app.config_from_object(settings, namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()
