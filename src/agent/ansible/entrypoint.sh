#!/bin/bash
set -e
eval `ssh-agent -s`
if [[ -f /opt/agent/vars/fd ]]; then ssh-add /opt/agent/vars/fd; fi
exec "$@"
