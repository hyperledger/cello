#
# SPDX-License-Identifier: Apache-2.0
#
"""
WSGI config for api_engine project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api_engine.settings")

application = get_wsgi_application()
