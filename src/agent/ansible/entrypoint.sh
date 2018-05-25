#!/bin/bash
set -e
eval `ssh-agent -s`
ssh-add /opt/agent/vars/fd
exec "$@"
