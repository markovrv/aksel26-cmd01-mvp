// ============================================
// Middleware загрузки файлов (Multer)
// Валидация расширений, безопасное именование
// ============================================

import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Директория для загрузок
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Создаём директории если их нет
const dirs = ["models", "audio", "images", "logos", "covers"];
dirs.forEach((dir) => {
	const fullPath = path.join(UPLOAD_DIR, dir);
	if (!fs.existsSync(fullPath)) {
		fs.mkdirSync(fullPath, { recursive: true });
	}
});

// White-list разрешённых расширений
const ALLOWED_EXTENSIONS = {
	models: [".glb", ".gltf"],
	audio: [".mp3", ".wav", ".ogg"],
	images: [".jpg", ".jpeg", ".png", ".webp"],
	logos: [".png", ".jpg", ".jpeg", ".svg"],
	covers: [".jpg", ".jpeg", ".png", ".webp"],
};

// Лимиты размера файлов
const FILE_LIMITS = {
	models: 5 * 1024 * 1024, // 5 MB
	audio: 10 * 1024 * 1024, // 10 MB
	images: 2 * 1024 * 1024, // 2 MB
	logos: 1 * 1024 * 1024, // 1 MB
	covers: 3 * 1024 * 1024, // 3 MB
};

/**
 * Фабрика создания storage для multer
 */
function createStorage(subDir) {
	return multer.diskStorage({
		destination: (req, file, cb) => {
			const dest = path.join(UPLOAD_DIR, subDir);
			cb(null, dest);
		},
		filename: (req, file, cb) => {
			// Генерируем уникальное имя файла
			const ext = path.extname(file.originalname).toLowerCase();
			const filename = `${uuidv4()}${ext}`;
			cb(null, filename);
		},
	});
}

/**
 * Фильтр расширений файлов
 */
function fileFilter(allowedExts) {
	return (req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();

		if (!allowedExts.includes(ext)) {
			const err = new Error(
				`Недопустимый тип файла. Разрешены: ${allowedExts.join(", ")}`,
			);
			err.code = "INVALID_FILE_TYPE";
			return cb(err, false);
		}

		cb(null, true);
	};
}

/**
 * Создание middleware загрузки файлов
 */
function createUpload(subDir) {
	const storage = createStorage(subDir);
	const allowedExts = ALLOWED_EXTENSIONS[subDir] || [];
	const limit = FILE_LIMITS[subDir] || 5 * 1024 * 1024;

	return multer({
		storage,
		fileFilter: fileFilter(allowedExts),
		limits: {
			fileSize: limit,
		},
	});
}

// Готовые middleware для разных типов файлов
export const uploadModel = createUpload("models");
export const uploadAudio = createUpload("audio");
export const uploadImage = createUpload("images");
export const uploadLogo = createUpload("logos");
export const uploadCover = createUpload("covers");

/**
 * Обработчик ошибок multer
 */
export function handleUploadError(err, req, res, next) {
	if (err instanceof multer.MulterError) {
		if (err.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({ error: "Файл слишком большой." });
		}
		return res.status(400).json({ error: err.message });
	}

	if (err) {
		return res.status(400).json({ error: err.message });
	}

	next();
}

/**
 * Генерация URL для загруженного файла
 */
export function getFileUrl(req, file, subDir) {
	const filename = path.basename(file.filename);
	return `/uploads/${subDir}/${filename}`;
}
