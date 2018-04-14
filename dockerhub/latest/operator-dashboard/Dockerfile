# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM hyperledger/cello-baseimage:x86_64-latest

CMD if [ "$DEBUG" = "True" ]; then python dashboard.py ; else gunicorn -w $(( 2 * `cat /proc/cpuinfo | grep "core id" | wc -l` + 1 )) -b 0.0.0.0:8080 dashboard:app ;fi
