// ============================================
// Главный файл сервера - Индустриальный гид
// ============================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import winston from "winston";

import { initDatabase, initSchema } from "./db/db.js";
import authRoutes from "./routes/auth.js";
import enterprisesRoutes from "./routes/enterprises.js";
import routesRoutes from "./routes/routes.js";
import pointsRoutes from "./routes/points.js";
import sessionsRoutes from "./routes/sessions.js";
import gamesRoutes from "./routes/games.js";
import certificatesRoutes from "./routes/certificates.js";
import adminRoutes from "./routes/admin.js";

// Получаем пути
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

// Конфигурация
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, "data/ar-guide.db");

// Настраиваем путь для загрузок
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT_DIR, "uploads");

// ============================================
// Логирование (Winston + Morgan)
// ============================================

const logger = winston.createLogger({
	level: NODE_ENV === "production" ? "info" : "debug",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json(),
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

// ============================================
// Инициализация приложения Express
// ============================================

const app = express();

// Безопасность
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

// CORS - разрешаем cookies для авторизации
app.use(
	cors({
		origin: true, // Разрешаем все origins в development
		credentials: true,
	}),
);

// Парсинг JSON и cookies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Логирование запросов
app.use(
	morgan("combined", {
		stream: {
			write: (message) => logger.http(message.trim()),
		},
	}),
);

// Статические файлы - загруженные файлы
if (!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOAD_DIR));

// ============================================
// Rate Limiting
// ============================================

// Общий лимит - 100 запросов за 15 минут
const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: { error: "Слишком много запросов. Попробуйте позже." },
	standardHeaders: true,
	legacyHeaders: false,
});

// Специальный лимит для начала сессий - 20 в час на IP
const sessionStartLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 20,
	message: {
		error: "Слишком много попыток начать экскурсию. Попробуйте через час.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Применяем общий лимит
app.use("/api", generalLimiter);

// Применяем специальный лимит для начала сессий
app.use("/api/session/start", sessionStartLimiter);

// ============================================
// API Routes
// ============================================

app.use("/api/auth", authRoutes);
app.use("/api/enterprises", enterprisesRoutes);
app.use("/api/routes", routesRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/session", sessionsRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/admin", adminRoutes);

// API info endpoint
app.get("/api", (req, res) => {
	res.json({
		name: "Индустриальный гид API",
		version: "1.0.0",
		description: "WebAR-платформа для промышленных экскурсий",
		endpoints: {
			auth: "/api/auth",
			enterprises: "/api/enterprises",
			routes: "/api/routes",
			points: "/api/points",
			sessions: "/api/session",
			games: "/api/games",
			certificates: "/api/certificates",
		},
	});
});

// ============================================
// Health check
// ============================================

app.get("/health", (req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// ============================================
// Раздача статики клиента (production)
// ============================================

const clientDistPath = path.join(ROOT_DIR, "client/dist");

if (fs.existsSync(clientDistPath)) {
	app.use(express.static(clientDistPath));

	// SPA fallback - все неизвестные маршруты отдают на index.html
	app.get("*", (req, res) => {
		res.sendFile(path.join(clientDistPath, "index.html"));
	});

	logger.info("Клиент раздаётся из " + clientDistPath);
} else {
	logger.warn(
		"Папка client/dist не найдена. Сервер работает только в API режиме.",
	);
}

// ============================================
// Обработка ошибок
// ============================================

app.use((err, req, res, next) => {
	logger.error("Unhandled error:", err);

	if (err.type === "entity.parse.failed") {
		return res.status(400).json({ error: "Некорректный JSON." });
	}

	res.status(500).json({
		error:
			NODE_ENV === "development" ? err.message : "Внутренняя ошибка сервера.",
	});
});

// ============================================
// Graceful shutdown
// ============================================

process.on("SIGTERM", () => {
	logger.info("SIGTERM received. Shutting down gracefully...");
	process.exit(0);
});

process.on("SIGINT", () => {
	logger.info("SIGINT received. Shutting down gracefully...");
	process.exit(0);
});

// ============================================
// Запуск сервера
// ============================================

async function startServer() {
	try {
		logger.info("=========================================");
		logger.info("Индустриальный гид - Запуск сервера");
		logger.info("=========================================");

		// Инициализируем БД
		await initDatabase();
		await initSchema();

		// Запускаем сервер
		app.listen(PORT, () => {
			logger.info(`Сервер запущен на порту ${PORT}`);
			logger.info(`Режим: ${NODE_ENV}`);
			logger.info(`БД: ${DB_PATH}`);
			logger.info(`Uploads: ${UPLOAD_DIR}`);
			logger.info("=========================================");
		});
	} catch (error) {
		logger.error("Ошибка запуска сервера:", error);
		process.exit(1);
	}
}

startServer();

export default app;
