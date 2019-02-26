#!/usr/bin/env bash

#for testfile in ${ROOT_PATH}/tests/postman/test/*; do
#    filename="${testfile##*/}"
#    docker run -v ${ROOT_PATH}/tests/postman:/etc/newman --network="host" -v /tmp:/tmp postman/newman_ubuntu1404:4.4.0 run /etc/newman/test/$filename -e /etc/newman/env.json
#
#    if [[ "$?" != "0" ]]; then
#        echo "API tests ${filename} failed";
#        exit 1;
#    else
#        echo "API tests ${filename} passed";
#    fi
#done
docker-compose up --abort-on-container-exit

cp ${ROOT_PATH}/tests/postman/junitResult.xml ${ROOT_PATH}/