initial-json:
	@envsubst < env.json.tmpl > env.json

test-api:
	@$(MAKE) initial-json
	bash test.sh || (echo "test api failed $$?"; exit 1)
