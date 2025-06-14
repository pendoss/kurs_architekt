#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Демонстрация микросервисной архитектуры${NC}"
echo -e "${BLUE}===========================================${NC}"

# Функция для проверки доступности сервиса
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url" > /dev/null; then
        echo -e "${GREEN}✅ $service_name доступен${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name недоступен${NC}"
        return 1
    fi
}

echo -e "\n${YELLOW}📋 Проверка состояния сервисов...${NC}"
check_service "http://localhost:3001/health" "Task Service"
check_service "http://localhost:3002/health" "Query Service"
check_service "http://localhost:3003/health" "Notification Service"

echo -e "\n${YELLOW}📝 1. Создание задач (CQRS Commands)...${NC}"
echo "Создаем первую задачу..."
TASK1_RESPONSE=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name": "Изучить CQRS", "description": "Command Query Responsibility Segregation"}')
echo "Ответ: $TASK1_RESPONSE"

sleep 1

echo "Создаем вторую задачу..."
TASK2_RESPONSE=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name": "Изучить Event Sourcing", "description": "Паттерн хранения событий"}')
echo "Ответ: $TASK2_RESPONSE"

sleep 1

echo "Создаем третью задачу..."
TASK3_RESPONSE=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name": "Настроить мониторинг", "description": "Prometheus + Grafana"}')
echo "Ответ: $TASK3_RESPONSE"

echo -e "\n${YELLOW}📖 2. Получение данных (CQRS Queries с кешированием)...${NC}"
echo "Первый запрос (Cache Miss):"
FIRST_QUERY=$(curl -s http://localhost:3002/api/tasks)
echo "$FIRST_QUERY" | jq '.'

sleep 1

echo -e "\nВторой запрос (Cache Hit):"
SECOND_QUERY=$(curl -s http://localhost:3002/api/tasks)
echo "$SECOND_QUERY" | jq '.'

echo -e "\n${YELLOW}🔍 3. Поиск задач...${NC}"
echo "Поиск по ключевому слову 'CQRS':"
SEARCH_RESULT=$(curl -s http://localhost:3002/api/tasks/search/CQRS)
echo "$SEARCH_RESULT" | jq '.'

echo -e "\n${YELLOW}✏️ 4. Обновление задачи...${NC}"
echo "Обновляем первую задачу:"
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "CQRS изучен!", "description": "Command Query Responsibility Segregation - изучено и понято"}')
echo "Ответ: $UPDATE_RESPONSE"

echo -e "\n${YELLOW}📊 5. Проверка статистики уведомлений...${NC}"
sleep 2  # Даем время на обработку событий
NOTIFICATION_STATS=$(curl -s http://localhost:3003/api/notifications/stats)
echo "Статистика: $NOTIFICATION_STATS"

echo -e "\n${YELLOW}📈 6. Проверка метрик кеша...${NC}"
echo "Получаем метрики из Query Service:"
curl -s http://localhost:3002/metrics | grep -E "(cache_hits|cache_misses)" | head -5

echo -e "\n${YELLOW}🗑️ 7. Удаление задачи...${NC}"
echo "Удаляем одну из задач:"
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/tasks/2)
echo "Ответ: $DELETE_RESPONSE"

echo -e "\n${YELLOW}🔄 8. Проверка Event Store...${NC}"
echo "Получаем историю событий (если есть UUID):"
# Здесь можно добавить запрос к event store, если нужно

echo -e "\n${GREEN}🎉 Демонстрация завершена!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${YELLOW}Для просмотра дашбордов откройте:${NC}"
echo -e "📊 Grafana: ${BLUE}http://localhost:3000${NC} (admin/admin)"
echo -e "📈 Prometheus: ${BLUE}http://localhost:9090${NC}"
echo -e "🐰 RabbitMQ: ${BLUE}http://localhost:15672${NC} (admin/password)"
echo -e "🚨 AlertManager: ${BLUE}http://localhost:9093${NC}"

echo -e "\n${YELLOW}Также можете использовать команды Make:${NC}"
echo -e "make open-grafana"
echo -e "make open-prometheus" 
echo -e "make open-rabbitmq"
echo -e "make test-all"
