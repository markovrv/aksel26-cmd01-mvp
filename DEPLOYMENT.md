# Российская Платформа Промышленного Туризма - Документация Docker

## Требования

- Docker Engine 20.10+
- Docker Compose 2.0+

---

## Быстрый старт

### Запуск всех сервисов

```bash
docker-compose up -d
```

### Пересборка и запуск с нуля

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Проброс базы данных

```bash
docker-compose exec server node init-seed.js
```

### Остановка сервисов

```bash
docker-compose down
```

### Остановка и удаление данных

```bash
docker-compose down -v
```

### Просмотр логов

```bash
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f server
docker-compose logs -f client
```

---

## Архитектура сети

```
┌────────────────────────────────────────────────────────────────────────────┐
│                               LAB Network                                   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Порт 21426: HTTP/HTTPS доступ (Nginx)                               │ │
│  │                                                                │      │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Container: industrial-tourism-client (Nginx + React)        │ │ │
│  │  │  ┌────────────────────────────────────────────────────────┐  │ │ │
│  │  │  │  Порт 8080: Swarm Static Files                         │  │ │ │
│  │  │  │  ───────────────────────────                            │  │ │ │
│  │  │  │  / → React SPA                                         │  │ │ │
│  │  │  │  /api/* → Proxy to server:5000                          │  │ │ │
│  │  │  │  /uploads/* → Proxy to server:5000                      │  │ │ │
│  │  │  └────────────────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                              │                                            │
│                     HTTP/HTTPS Request                                      │
│                              │                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Внутренняя Docker сеть:                                             │ │
│  │  mvp_industrial-tourism-network                                       │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Container: industrial-tourism-server (Node.js + Express)      │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │ │ │
│  │  │  │  Порт 5000 (ВНЕШНИЙ ДОСТУП ЗАПРЕЩЕН)                     │   │ │ │
│  │  │  │  ───────────────────────────                              │   │ │ │
│  │  │  │  /api/* REST API Endpoints                                │   │ │ │
│  │  │  │  /uploads/* File Storage                                  │   │ │ │
│  │  │  │  SQLite Database (Постоянное хранилище)                   │   │ │ │
│  │  │  └─────────────────────────────────────────────────────────┘   │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## URLs и порты

| Сервис     | Внутри контейнера | Host порт | Доступность |
|------------|-------------------|-----------|-------------|
| Frontend   | 8080              | 21426     | **Внешний** (localhost:21426) |
| Backend    | 5000              | НЕ ОТКРЫТ | **Внутренний** (только внутри сети) |

### Доступные URLs

- **Основной портал**: http://localhost:21426
- **API запросы**: http://localhost:21426/api/* (через Nginx прокси)
- **Файлы**: http://localhost:21426/uploads/* (через Nginx прокси)

⚠️ **ВАЖНО:** Прямой доступ к порт 5000 (backend) извне не доступен. Все API запросы должны проходить через Nginx прокси.

---

## Данные

### Постоянное хранение

| Данные | Объем Docker | Расположение                                     |
|--------|-------------|--------------------------------------------------|
| База данных | `server-data` | `./server/data/` (виртуальный объем) |
| Загрузки | `server-uploads` | `./server/uploads/` (виртуальный объем) |

### Бэкап базы данных

```bash
# Сохранить базу из контейнера
docker exec industrial-tourism-server cp /app/data/platform.db /tmp/platform.db
docker cp industrial-tourism-server:/tmp/platform.db ./platform-backup.db

# Альтернативный способ
docker run --rm \
  -v mvp_server-data:/data \
  -v "$(pwd)":"/backup" \
  alpine tar czf /backup/platform-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Восстановление базы данных

```bash
# Остановить контейнер
docker-compose stop server

# Скопировать базу внутрь контейнера
docker cp platform-backup.db industrial-tourism-server:/tmp/platform.db
docker exec industrial-tourism-server mv /tmp/platform.db /app/data/platform.db

# Перезапустить контейнер
docker-compose start server
```

---

## Variables среды

### Автоматические переменные

| Переменная | Значение | Описание |
|------------|----------|----------|
| NODE_ENV | production | Режим работы сервера |
| VITE_API_URL | http://localhost:21426 | URL для фронтенда |

---

## Проверка работоспособности

### Проверка статуса контейнеров

```bash
docker-compose ps
```

Ожидаемый вывод:

```
NAME                        STATUS
industrial-tourism-client   Up (healthy)
industrial-tourism-server   Up (healthy)
```

### Проверка внешнее доступности

```bash
# Проверка фронтенда
curl -I http://localhost:21426

# Проверка API через прокси
curl http://localhost:21426/api/events
```

### Проверка состояния BAC

```bash
# Проверка healthcheck
docker inspect --format='{{.State.Health.Status}}' industrial-tourism-server
docker inspect --format='{{.State.Health.Status}}' industrial-tourism-client
```

---

## Отладка

### Просмотр логов

```bash
# Все логи в реальном времени
docker-compose logs -f

# Логи сервера
docker-compose logs -f server
docker-compose logs --tail=100 server

# Логи клиента
docker-compose logs -f client
docker-compose logs --tail=100 client
```

### Доступ к shell контейнера

```bash
# Backend container
docker exec -it industrial-tourism-server sh

# Frontend container
docker exec -it industrial-tourism-client sh
```

### Выполнение команд в контейнере

```bash
# Проверка состояния базы
docker exec industrial-tourism-server sqlite3 /app/data/platform.db "SELECT COUNT(*) FROM students;"

# Проверка подключения к API
docker exec industrial-tourism-server wget -qO- http://localhost:5000/api/events | head

# Проверка логов Node.js
docker exec industrial-tourism-server tail -f /app/node_modules/.cache/... 2>/dev/null || echo "No cache logs"
```

---

## Обновление и перекомпиляция

### Обновить образы

```bash
# Пересобрать все
docker-compose build --no-cache

# Пересобрать конкретный сервис
docker-compose build server
docker-compose build client
```

### Применить обновления

```bash
# Перезапустите после build
docker-compose up -d

# Или перезапустите потенциально отсталые
docker-compose up -d --force-recreate
```

---

## Управление состоянием

### Сброс всех данных

```bash
# Остановите контейнеры и удалите томы
docker-compose down -v

# Перекомпилируйте и перезапустите
docker-compose build --no-cache
docker-compose up -d

# Инициализируйте базу данных
docker-compose exec server node init-seed.js
```

### Опасная команда (внимание!)

```bash
# Удаляет ВСЕ данные БД и файлы загрузок!
docker-compose down -v -r all
```

---

## Команды для деплоя

### Полная установка на новой машине

```bash
# Клонируйте или скопируйте проект
git clone <repo-url>  # или копирование вручную

# Перейдите в директорию проекта
cd mvp

# Постройте и запустите
docker-compose build --no-cache
docker-compose up -d

# Инициализируйте базу
docker-compose exec server node init-seed.js

# Проверьте что работает
curl http://localhost:21426/api/events | head
```

---

## Reservoir Array Commands

### Повторный запуск конкретных сервисов

```bash
# Перезапуск только сервера
docker-compose restart server

# Перезапуск только клиента
docker-compose restart client

# Перезапуск всех
docker-compose restart
```

### Получение информации о контейнерах

```bash
# Статус всех контейнеров
docker ps -a

# Информация о конкретном контейнере
docker inspect industrial-tourism-server
docker inspect industrial-tourism-client
```

---

## Проблемы и решения

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs server

# Пересобрать образы
docker-compose build --no-cache

# Удалить и создать заново
docker-compose down
docker-system prune -a
docker-compose up -d
```

### Ошибка подключения к API

```bash
# Проверить что сервер внутри сети работает
docker exec industrial-tourism-server wget -qO- http://localhost:5000/api/events

# Проверить nginx логи
docker-compose logs client | grep -i error
```

### База данных не инициализирована

```bash
# Проверить статус базы
docker exec industrial-tourism-server sqlite3 /app/data/platform.db ".tables"

# Перезапустить seed
docker-compose exec server node init-seed.js
```

### Прокси Nginx не работает

```bash
# Пересобрать client
docker-compose build --no-cache client

# Проверить конфигурацию nginx
docker exec industrial-tourism-client nginx -t

# Проверить что конфиг подключен
docker exec industrial-tourism-client cat /etc/nginx/conf.d/default.conf
```

### Проблема с CORS

Прокси Nginx должен обрабатывать CORS автоматически. В файле `client/nginx.conf`:

```nginx
location /api/ {
    proxy_pass http://server:5000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # ... другие опции
}
```

---

## Безопасность

### Внутренняя сеть

Backend порт 5000 НЕ доступен напрямую извне. Доступ только через:
- Docker internal network
- Nginx proxy внутри client контейнера

### Переменные окружения

Для production используйте внешние переменные:

```bash
# Создайте .env в корне проекта
NODE_ENV=production
JWT_SECRET=your-production-secret-key-change-me
```

---

## Метрики производительности

### Размер образов

| Образ | Размер | Описание |
|-------|--------|----------|
| mvp-client | ~50МБ | Nginx + React SPA |
| mvp-server | ~150МБ | Node.js + Express + зависимостей |

### Загружаемые файлы

- Максимум размер: 50МБ
- Поддерживаются: все типы
- Хранение: том `server-uploads`

### Время отклика

| Запрос | Время | Примечание |
|--------|-------|------------|
| GET /api/events | <50мс | RAID |
| POST /api/auth/* | <100мс | Включает хеширование |
| POST /api/solutions | <500мс | При наличии файла |

---

## Не для MVP (плановый)

### Email конфликты

Функционал: уведомления на email о новых кейсах, статусах решений.

### Monitoring

Инструменты: Prometheus, Grafana, ELK stack для логирования.

### Scalability

- Переключение на PostgreSQL
- Redis для кэширования сессий
- Cluster Node.js (PM2)
- Load balancer (Traefik/Nginx)

### CI/CD

- GitHub Actions для тестов и деплоя
- Автоматические сборки Docker образов
- Автоматический переключатель

---

## Быстрый справочник команд

```bash
# Основные команды
docker-compose up -d                 # Запуск
docker-compose down                  # Остановка
docker-compose down -v               # Остановка + удаление данных
docker-compose logs -f               # Логи в реальном времени
docker-compose restart               # Перезапуск

# Отладка
docker-compose exec server sh        # Shell сервера
docker exec industrial-tourism-client sh  # Shell клиента
docker inspect industrial-tourism-server  # Детали

# Deployment
docker-compose build --no-cache      # Пересобрать
docker-compose build server          # Сервер
docker-compose build client          # Клиент

# Данные
docker-compose exec server node init-seed.js  # Инициализация
docker cp server:/app/data/platform.db .      # Бэкап
```

---

**Важное замечание:** Эта инфраструктура предназначена для MVP. Для production развертывания потребуется пересмотр архитектуры и внедрение дополнительных механизмов безопасности.

---

**Последнее обновление**: 2026-04-21

**Состояние**: 🟢 ГОТОВО К РАЗВЕРТЫВАНИЮ