FROM _NS_/cello-baseimage:_TAG_

COPY mongo/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

VOLUME /data/db /data/configdb

RUN ln -s usr/local/bin/docker-entrypoint.sh /entrypoint.sh # backwards compat
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 27017
CMD ["mongod"]
