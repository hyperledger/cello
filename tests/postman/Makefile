initial-json:
	@envsubst < env.json.tmpl > env.json

test-api:
	@$(MAKE) initial-json
	bash ${ROOT_PATH}/tests/postman/test.sh || (echo "test api failed $$?"; exit 1)
