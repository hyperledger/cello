#!/usr/bin/env bash
#
# Copyright 2009-2017 SAP SE or an SAP affiliate company.
# All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
holdup -t 120 tcp://rabbitmq:5672

export C_FORCE_ROOT=yes
cd /app
celery worker -A dashboard.celery --autoscale=20,3 -l info -f /var/log/celery.log -D