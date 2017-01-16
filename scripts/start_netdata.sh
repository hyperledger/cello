#!/usr/bin/env bash

docker run -d \
               --net=host \
               --cap-add SYS_PTRACE \
               -v /proc:/host/proc:ro \
               -v /sys:/host/sys:ro \
               -v /var/run/docker.sock:/var/run/docker.sock \
               -p 19999:19999 titpetric/netdata