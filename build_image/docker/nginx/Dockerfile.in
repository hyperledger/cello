FROM hyperledger/cello-api-engine:latest as static_files

FROM nginx:1.15.7

COPY build_image/docker/nginx/config-nginx.sh /config-nginx.sh
COPY build_image/docker/nginx/nginx.conf.default /etc/nginx/nginx.conf.default
COPY --from=static_files /var/www/server/static /var/www/server/static
RUN chmod +x /config-nginx.sh

RUN mkdir /var/lib/nginx

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
	&& ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80 443

CMD ["bash", "-c", "/config-nginx.sh && nginx -g 'daemon off;'"]
