init-nginx-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/nginx
	@envsubst < templates/nginx/config.tmpl > nginx/config.yml
	@envsubst < templates/nginx/deploy.tmpl > nginx/deploy.yml
	@envsubst < templates/nginx/service.tmpl > nginx/service.yml
	@envsubst < templates/nginx/ingress.tmpl > nginx/ingress.yml

init-api-engine-yaml:
	rm -rf ${ROOT_PATH}/bootup/kubernetes/api-engine
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/api-engine
	@envsubst < templates/api-engine/config.tmpl > api-engine/config.yml
	@envsubst < templates/api-engine/${DEPLOY_TEMPLATE_NAME} > api-engine/deploy.yml
	@envsubst < templates/api-engine/service.tmpl > api-engine/service.yml
	if [ "$(MODE)" = "dev" ]; then \
		envsubst < templates/api-engine/ingress.tmpl > api-engine/ingress.yml; \
	fi

init-api-engine-tasks-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/api-engine-tasks
	@envsubst < templates/api-engine-tasks/deploy.tmpl > api-engine-tasks/deploy.yml

init-rabbitmq-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/rabbitmq
	@envsubst < templates/rabbitmq/config.tmpl > rabbitmq/config.yml
	@envsubst < templates/rabbitmq/deploy.tmpl > rabbitmq/deploy.yml
	@envsubst < templates/rabbitmq/service.tmpl > rabbitmq/service.yml

init-mongo-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/mongo
	@envsubst < templates/mongo/deploy.tmpl > mongo/deploy.yml
	@envsubst < templates/mongo/service.tmpl > mongo/service.yml

init-redis-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/redis
	@envsubst < templates/redis/deploy.tmpl > redis/deploy.yml
	@envsubst < templates/redis/service.tmpl > redis/service.yml

init-operator-dashboard-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/operator-dashboard
	@envsubst < templates/operator-dashboard/config.tmpl > operator-dashboard/config.yml
	@envsubst < templates/operator-dashboard/${DEPLOY_TEMPLATE_NAME} > operator-dashboard/deploy.yml
	@envsubst < templates/operator-dashboard/service.tmpl > operator-dashboard/service.yml

init-user-dashboard-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/user-dashboard
	@envsubst < templates/user-dashboard/config.tmpl > user-dashboard/config.yml
	@envsubst < templates/user-dashboard/${DEPLOY_TEMPLATE_NAME} > user-dashboard/deploy.yml
	@envsubst < templates/user-dashboard/service.tmpl > operator-dashboard/service.yml
	@envsubst < templates/user-dashboard/ingress.tmpl > user-dashboard/ingress.yml

init-parse-server-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/parse-server
	@envsubst < templates/parse-server/config.tmpl > parse-server/config.yml
	@envsubst < templates/parse-server/${DEPLOY_TEMPLATE_NAME} > parse-server/deploy.yml
	@envsubst < templates/parse-server/service.tmpl > parse-server/service.yml

init-mysql-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/mysql
	@envsubst < templates/mysql/config.tmpl > mysql/config.yml
	@envsubst < templates/mysql/deploy.tmpl > mysql/deploy.yml
	@envsubst < templates/mysql/service.tmpl > mysql/service.yml

init-postgres-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/postgres
	@envsubst < templates/postgres/config.tmpl > postgres/config.yml
	@envsubst < templates/postgres/deploy.tmpl > postgres/deploy.yml
	@envsubst < templates/postgres/service.tmpl > postgres/service.yml

init-watchdog-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/watchdog
	@envsubst < templates/watchdog/config.tmpl > watchdog/config.yml
	@envsubst < templates/watchdog/${DEPLOY_TEMPLATE_NAME} > watchdog/deploy.yml

init-keycloak-yaml:
	mkdir -p ${ROOT_PATH}/bootup/kubernetes/keycloak
	@envsubst < templates/keycloak/config.tmpl > keycloak/config.yml
	@envsubst < templates/keycloak/deploy.tmpl > keycloak/deploy.yml
	@envsubst < templates/keycloak/service.tmpl > keycloak/service.yml
	@envsubst < templates/keycloak/ingress.tmpl > keycloak/ingress.yml

init-yaml:
	@$(MAKE) init-nginx-yaml
	@$(MAKE) init-api-engine-yaml
	@$(MAKE) init-api-engine-tasks-yaml
	@$(MAKE) init-redis-yaml
	@$(MAKE) init-postgres-yaml

start:
	@kubectl apply --force -f postgres/ -n ${K8S_DEPLOY_NAMESPACE}
	@kubectl apply --force -f redis/ -n ${K8S_DEPLOY_NAMESPACE}
	@kubectl apply --force -f api-engine-tasks/ -n ${K8S_DEPLOY_NAMESPACE}
	@kubectl apply --force -f api-engine/ -n ${K8S_DEPLOY_NAMESPACE}
	if [ "$(MODE)" != "dev" ]; then \
		kubectl apply --force -f nginx/ -n ${K8S_DEPLOY_NAMESPACE}; \
	fi

stop:
	@kubectl delete -f postgres/ -n ${K8S_DEPLOY_NAMESPACE}
	@kubectl delete -f redis/ -n ${K8S_DEPLOY_NAMESPACE}
	@kubectl delete -f api-engine-tasks/ -n ${K8S_DEPLOY_NAMESPACE}
	@kubectl delete -f api-engine/ -n ${K8S_DEPLOY_NAMESPACE}
	if [ "$(MODE)" != "dev" ]; then \
		kubectl delete -f nginx/ -n ${K8S_DEPLOY_NAMESPACE}; \
	fi
