FROM circleci/node:latest-browsers

WORKDIR /usr/src/app/
USER root
COPY src/dashboard/package.json ./
RUN yarn
COPY src/dashboard ./
RUN npm run build

FROM nginx:1.15.12

COPY --from=0 /usr/src/app/dist /usr/share/nginx/html
COPY build_image/docker/dashboard/config-nginx.sh /
RUN chmod +x /config-nginx.sh
COPY build_image/docker/dashboard/default.conf.tmpl /etc/nginx/conf.d/default.conf.tmpl

EXPOSE 80

CMD ["bash", "-c", "/config-nginx.sh && nginx -g 'daemon off;'"]
