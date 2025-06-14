# Курсовая работа: Микросервисная архитектура с Task Management

## Описание проекта

Это курсовая работа, представляющая микросервисное приложение для управления задачами (Task Management), реализованное с использованием современных технологий и паттернов.

## Архитектура

### Микросервисы:

1. **Task Service** (порт 3001)
   - Реализует CQRS (Command Query Responsibility Segregation)
   - Event Sourcing для хранения событий
   - Обработка команд создания, обновления и удаления задач
   - Публикация событий в RabbitMQ

2. **Query Service** (порт 3002)
   - Сервис для чтения данных
   - Кеширование с помощью Redis
   - Поиск задач по названию
   - Метрики попаданий/промахов кеша

3. **Notification Service** (порт 3003)
   - Обработка событий из RabbitMQ
   - Отправка уведомлений о изменениях задач
   - Асинхронная обработка сообщений

### Инфраструктура:

- **PostgreSQL** - основная база данных + event store
- **Redis** - кеширование для Query Service
- **RabbitMQ** - брокер сообщений для межсервисного взаимодействия
- **Prometheus** - сбор метрик
- **Grafana** - визуализация метрик и дашборды
- **AlertManager** - управление алертами

## Технические требования (выполнены)
- [x] **Контейнеризированное микросервисное приложение** (3+ сервиса)
- [x] **Кеширование** (Redis в Query Service)
- [x] **Брокер сообщений** (RabbitMQ между Task Service и Notification Service)
- [x] **Мониторинг** (Prometheus + Grafana для всех сервисов)
- [x] **CQRS** (Task Service разделяет команды и запросы)
- [x] **Event Sourcing** (Task Service хранит события в event store)

## Структура проекта

```
├── docker-compose.yml
├── database/
│   └── init.sql
├── services/
│   ├── task-service/          # CQRS + Event Sourcing
│   ├── query-service/         # Кеширование Redis
│   └── notification-service/  # RabbitMQ Consumer
└── monitoring/
    ├── prometheus/
    ├── grafana/
    └── alertmanager/
```

## API Endpoints

### Task Service (порт 3001)
- `POST /api/tasks` - Создать задачу
- `PUT /api/tasks/:id` - Обновить задачу
- `DELETE /api/tasks/:id` - Удалить задачу
- `GET /api/tasks/:id/events` - История событий задачи

### Query Service (порт 3002)
- `GET /api/tasks` - Получить все задачи (с кешированием)
- `GET /api/tasks/:id` - Получить задачу по ID (с кешированием)
- `GET /api/tasks/search/:name` - Поиск задач по названию
- `DELETE /api/tasks/cache` - Очистить кеш

### Notification Service (порт 3003)
- `GET /api/notifications/stats` - Статистика обработанных уведомлений

## Мониторинг

### Prometheus (порт 9090)
- Сбор метрик со всех сервисов
- Настроенные правила алертов

### Grafana (порт 3000)
- **Логин**: admin / admin
- Дашборды для каждого микросервиса:
  - Task Service Dashboard
  - Query Service Dashboard (с метриками кеша)
  - Notification Service Dashboard

### AlertManager (порт 9093)
- Управление алертами
- Уведомления о проблемах в сервисах

## Запуск приложения

1. Убедитесь, что Docker и Docker Compose установлены

2. Клонируйте проект и перейдите в директорию:
```bash
cd architect_kurs
```

3. Запустите все сервисы:
```bash
docker-compose up -d
```

4. Проверьте статус сервисов:
```bash
docker-compose ps
```

5. Дождитесь полной инициализации всех сервисов (около 1-2 минут)

## Тестирование

### Создание задачи:
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name": "Тестовая задача", "description": "Описание задачи"}'
```

### Получение задач (с кешированием):
```bash
curl http://localhost:3002/api/tasks
```

### Поиск задач:
```bash
curl http://localhost:3002/api/tasks/search/тест
```

### Обновление задачи:
```bash
curl -X PUT http://localhost:3001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Обновленная задача", "description": "Новое описание"}'
```

### Удаление задачи:
```bash
curl -X DELETE http://localhost:3001/api/tasks/1
```

## Проверка компонентов

### Health Checks:
```bash
curl http://localhost:3001/health  # Task Service
curl http://localhost:3002/health  # Query Service
curl http://localhost:3003/health  # Notification Service
```

### Метрики:
```bash
curl http://localhost:3001/metrics  # Task Service metrics
curl http://localhost:3002/metrics  # Query Service metrics
curl http://localhost:3003/metrics  # Notification Service metrics
```

### RabbitMQ Management:
- URL: http://localhost:15672
- Логин: admin / password

### PostgreSQL:
- Host: localhost:5432
- Database: taskdb
- User: admin / password

### Redis:
- Host: localhost:6379

## Особенности реализации

### CQRS в Task Service
- Команды обрабатываются через CommandHandler
- События сохраняются в event store
- Разделение ответственности между записью и чтением

### Event Sourcing
- Все изменения сохраняются как события в таблице `events`
- Возможность восстановления состояния из событий
- Полная история изменений

### Кеширование в Query Service
- Redis кеш для часто запрашиваемых данных
- TTL (время жизни) для разных типов запросов
- Метрики cache hit/miss ratio

### Асинхронная обработка
- RabbitMQ для межсервисного взаимодействия
- Notification Service обрабатывает события асинхронно
- Надежная доставка сообщений

### Мониторинг и наблюдаемость
- Prometheus метрики для всех сервисов
- Grafana дашборды для визуализации
- AlertManager для уведомлений о проблемах

## Остановка приложения

```bash
docker-compose down
```

Для полной очистки (включая volumes):
```bash
docker-compose down -v
```

## Автор

Курсовая работа по архитектуре программных систем
Микросервисная архитектура с CQRS, Event Sourcing, кешированием и мониторингом
