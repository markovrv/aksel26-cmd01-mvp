# ============================================
# Multi-stage Dockerfile для Индустриальный гид
# Stage 1: Build client (React + Vite)
# ============================================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Копируем только package files для кэширования npm
COPY client/package.json ./

RUN npm i

# Копируем весь клиентский код и собираем
COPY client/ ./
RUN npm run build

# ============================================
# Stage 2: Production server (Express + SQLite)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Устанавливаем production dependencies сервера
COPY server/package.json /app/
RUN npm i

# Копируем исходный код сервера
COPY server/ /app/server/

# Копируем собранный клиент из stage 1
COPY --from=client-builder /app/client/dist /app/client/dist

# Копируем статические ассеты фронтенда (A-Frame, AR.js, изображения, маркеры, 3D-модели)
COPY client/public/ /app/client/public/

# Копируем uploads (заглушки covers/logos сгенерированные скриптом)
COPY uploads/ /app/uploads/

# Копируем entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Создаём директорию для данных (SQLite)
RUN mkdir -p /app/data

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "/app/server/src/index.js"]