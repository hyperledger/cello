FROM busybox as downloader

RUN cd /tmp && wget -c https://github.com/hyperledger/cello/archive/master.zip && \
    unzip master.zip

FROM nginx:1.15.7

RUN apt-get update && apt-get install -y wget && \
	apt-get autoclean && apt-get clean && apt-get autoremove && rm -rf /var/cache/apt/
COPY --from=downloader /tmp/cello-master/build_image/docker/common/nginx/config-nginx.sh /config-nginx.sh
COPY --from=downloader /tmp/cello-master/build_image/docker/common/nginx/nginx.conf.default /etc/nginx/nginx.conf.default
RUN mkdir -p /var/www/static
RUN cd /tmp && wget https://github.com/encode/django-rest-framework/archive/master.tar.gz && \
    tar -zxvf master.tar.gz && mv django-rest-framework-master/rest_framework/static/rest_framework /var/www/static/ && rm -rf django-rest-framework-master master.tar.gz && \
    wget https://github.com/axnsan12/drf-yasg/archive/master.tar.gz && tar -zxvf master.tar.gz && mv drf-yasg-master/src/drf_yasg/static/drf-yasg /var/www/static/ && rm -rf drf-yasg-master master.tar.gz
RUN chmod +x /config-nginx.sh

RUN mkdir /var/lib/nginx

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
	&& ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80 443

CMD ["bash", "-c", "/config-nginx.sh && nginx -g 'daemon off;'"]
