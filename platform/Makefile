COMPOSE = docker compose --env-file .env -f infra/dev/docker-compose.yml

.PHONY: dev-up dev-down dev-ps dev-logs dev-config

dev-up:
	$(COMPOSE) up -d --build

dev-down:
	$(COMPOSE) down

dev-ps:
	$(COMPOSE) ps

dev-logs:
	$(COMPOSE) logs -f --tail=200

dev-config:
	$(COMPOSE) config
