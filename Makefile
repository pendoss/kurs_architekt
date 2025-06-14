.PHONY: up down build logs test clean help

# Цвета для вывода
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Показать справку
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

up: ## Запустить все сервисы
	@echo "$(GREEN)Запуск всех сервисов...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Сервисы запущены! Ожидайте 1-2 минуты для полной инициализации.$(NC)"

down: ## Остановить все сервисы
	@echo "$(YELLOW)Остановка всех сервисов...$(NC)"
	docker-compose down

build: ## Пересобрать все образы
	@echo "$(GREEN)Пересборка образов...$(NC)"
	docker-compose build --no-cache

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-task: ## Показать логи Task Service
	docker-compose logs -f task-service

logs-query: ## Показать логи Query Service
	docker-compose logs -f query-service

logs-notification: ## Показать логи Notification Service
	docker-compose logs -f notification-service

status: ## Показать статус сервисов
	@echo "$(GREEN)Статус сервисов:$(NC)"
	docker-compose ps

test-create: ## Создать тестовую задачу
	@echo "$(GREEN)Создание тестовой задачи...$(NC)"
	curl -X POST http://localhost:3001/api/tasks \
		-H "Content-Type: application/json" \
		-d '{"name": "Тестовая задача", "description": "Описание тестовой задачи"}' | jq

test-get: ## Получить все задачи
	@echo "$(GREEN)Получение всех задач...$(NC)"
	curl http://localhost:3002/api/tasks | jq

test-search: ## Поиск задач
	@echo "$(GREEN)Поиск задач...$(NC)"
	curl http://localhost:3002/api/tasks/search/тест | jq

test-health: ## Проверить health всех сервисов
	@echo "$(GREEN)Проверка health сервисов:$(NC)"
	@echo "Task Service:"
	@curl -s http://localhost:3001/health | jq
	@echo "Query Service:"
	@curl -s http://localhost:3002/health | jq
	@echo "Notification Service:"
	@curl -s http://localhost:3003/health | jq

test-all: test-create test-get test-search ## Запустить все тесты

clean: ## Удалить все контейнеры и volumes
	@echo "$(YELLOW)Очистка всех данных...$(NC)"
	docker-compose down -v
	docker system prune -f

open-grafana: ## Открыть Grafana в браузере
	@echo "$(GREEN)Открытие Grafana (admin/admin)...$(NC)"
	open http://localhost:3000

open-prometheus: ## Открыть Prometheus в браузере
	@echo "$(GREEN)Открытие Prometheus...$(NC)"
	open http://localhost:9090

open-rabbitmq: ## Открыть RabbitMQ Management в браузере
	@echo "$(GREEN)Открытие RabbitMQ Management (admin/password)...$(NC)"
	open http://localhost:15672

open-all: open-grafana open-prometheus open-rabbitmq ## Открыть все веб-интерфейсы

demo: up ## Запуск демо-сценария
	@echo "$(GREEN)Запуск демонстрации...$(NC)"
	@sleep 30
	@echo "$(GREEN)Создание тестовых задач...$(NC)"
	@make test-create
	@sleep 2
	@make test-create
	@sleep 2
	@echo "$(GREEN)Получение задач (проверка кеша)...$(NC)"
	@make test-get
	@sleep 1
	@make test-get
	@echo "$(GREEN)Демонстрация завершена! Проверьте дашборды в Grafana.$(NC)"
