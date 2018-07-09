#!/usr/bin/env bash

cd ~/generate-crypto/ && ./byfn.sh -m generate -c ${CHANNEL_NAME} && cp -r crypto-config channel-artifacts ~/crypto-files/
