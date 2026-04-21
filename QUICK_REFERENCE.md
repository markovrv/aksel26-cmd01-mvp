# Быстрый справочник Docker - Промышленный туризм

## 🚀 Быстрый старт (2 минуты)

```bash
# 1. Запустить все
docker-compose up -d

# 2. Инициализировать базу
docker-compose exec server node init-seed.js

# 3. Проверить
curl http://localhost:21426/api/events

# 4. Открыть в браузере
open http://localhost:21426
```

---

## 📝 Учетные данные

### Администратор
```
Email: admin@platform.ru
Пароль: admin123
```

### Студенты
```
Email: ivan@student.ru
Пароль: password123
```

### Компании
```
Email: hr@kmz.ru
Пароль: company123
```

**Готово 5 студентов + 5 компаний 🎉**

---

## 🔍 Проверка состояния

```bash
# Контейнеры
docker-compose ps

# Логи в реальном времени
docker-compose logs -f

# Статус healthcheck
docker inspect --format='{{.State.Health.Status}}' industrial-tourism-server
```

---

## 🔧 Частые проблемы

### Проблема: `/api/events` не работает
```bash
# Прокси через Nginx обязателен
# ❌ НЕ работает: curl http://localhost:5000/api/events
# ✅ Работает: curl http://localhost:21426/api/events
```

### Проблема: База не инициализирована
```bash
# Пересоздать базу
docker-compose down -v
docker-compose up -d
docker-compose exec server node init-seed.js
```

### Проблема: Логи партиций
```bash
# Посмотреть логи клиента
docker-compose logs client | grep -i error

# Посмотреть логи сервера
docker-compose logs server
```

### Проблема: Порт занят
```bash
# Проверить что порт 21426 свободен
netstat -ano | findstr :21426

# Остановить conflicting процесс
docker-compose down
```

---

## 🗑️ Сброс всего

```bash
# Полный сброс
docker-compose down -v

# Пересобрать образы
docker-compose build --no-cache

# Перезапустить
docker-compose up -d

# Переинициализировать базу
docker-compose exec server node init-seed.js
```

---

## 📁 Структура данных

| Объем | Описание | Путь (гост) |
|-------|----------|-------------|
| server-data | SQLite база | `server/data/` |
| server-uploads | Файлы решений | `server/uploads/` |

---

## 🔄 Обновления

```bash
# Обновить образы
docker-compose build --no-cache

# Перезапустить с обновлениями
docker-compose up -d
```

---

## 🐛 Отладка

```bash
# Вход в контейнер сервера
docker exec -it industrial-tourism-server sh

# Вход в контейнер клиента
docker exec -it industrial-tourism-client sh

# Проверить что база работает
docker exec industrial-tourism-server sqlite3 /app/data/platform.db ".tables"

# Тест API внутри сети
docker exec industrial-tourism-server wget -qO- http://localhost:5000/api/events
```

---

## Архитектура

```
┌─────────────────────────────────────┐
│  Host:21426 (Nginx + React + Proxy) │
│         ↓                           │
│  Docker Network                     │
│         ↓                           │
│  Container:5000 (Express API)       │
└─────────────────────────────────────┘
```

**Важно:** API доступен тольков  через прокси (localhost:21426/api/*).
Прямой доступ к порту 5000 невозможен.

---

## Быстрые команды

```bash
# Старт
docker-compose up -d

# Стоп
docker-compose down

# Логи
docker-compose logs -f

# Перезапуск
docker-compose restart

# Удалить все
docker-compose down -v
```

---

**Создано**: 2026-04-21
**Статус**: 🟢 ГОТОВО К ИСПОЛЬЗОВАНИЮ