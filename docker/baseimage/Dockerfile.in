FROM _DOCKER_BASE_
COPY docker/baseimage /tmp/baseimage
RUN cd /tmp/baseimage && \
rm -rf /tmp/baseimage
COPY src /app
RUN	cd /app/ && \
	rm -rf /tmp/cello
WORKDIR /app
