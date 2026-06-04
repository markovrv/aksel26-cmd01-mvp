// ============================================
// Модуль работы с SQLite базой данных
// Используется sqlite3 с Promise-обёртками
// ============================================

import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Получаем путь к БД из переменной окружения
const DB_PATH =
	process.env.DB_PATH || join(__dirname, "../../data/ar-guide.db");

// Глобальный экземпляр базы данных
let db = null;

/**
 * Инициализация подключения к базе данных
 */
export function initDatabase() {
	return new Promise((resolve, reject) => {
		// Создаём директорию для БД если её нет
		const dbDir = dirname(DB_PATH);
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		db = new sqlite3.Database(DB_PATH, (err) => {
			if (err) {
				console.error("[DB] Ошибка подключения к БД:", err.message);
				reject(err);
				return;
			}
			console.log("[DB] Подключено к SQLite:", DB_PATH);

			// Включаем foreign keys
			db.run("PRAGMA foreign_keys = ON", (err) => {
				if (err) {
					console.error("[DB] Ошибка включения foreign keys:", err.message);
					reject(err);
					return;
				}
				resolve(db);
			});
		});
	});
}

/**
 * Получить экземпляр базы данных
 */
function getDb() {
	if (!db) {
		throw new Error(
			"[DB] База данных не инициализирована. Вызовите initDatabase() сначала.",
		);
	}
	return db;
}

/**
 * Выполнить SQL-запрос с параметрами (INSERT, UPDATE, DELETE)
 * Используем serialize для гарантии правильного порядка выполнения
 */
export async function dbRun(sql, params = []) {
	return new Promise((resolve, reject) => {
		const database = getDb();
		let result = { changes: 0, lastInsertRowid: 0 };

		database.serialize(() => {
			database.run(sql, params, function (err) {
				if (err) {
					reject(err);
					return;
				}
				// Используем 'this' внутри callback - это работает
				result = {
					changes: this.changes,
					lastInsertRowid: this.lastInsertRowid,
				};
			});

			// После выполнения запроса получаем lastInsertRowid
			database.get("SELECT last_insert_rowid() as id", (err, row) => {
				if (!err && row) {
					result.lastInsertRowid = row.id;
				}
				resolve(result);
			});
		});
	});
}

/**
 * Получить одну строку
 */
export async function dbGet(sql, params = []) {
	return new Promise((resolve, reject) => {
		const database = getDb();
		database.get(sql, params, (err, row) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(row || null);
		});
	});
}

/**
 * Получить все строки
 */
export async function dbAll(sql, params = []) {
	return new Promise((resolve, reject) => {
		const database = getDb();
		database.all(sql, params, (err, rows) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(rows);
		});
	});
}

/**
 * Инициализация структуры базы данных (таблицы и индексы)
 */
export async function initSchema() {
	const schemaPath = join(__dirname, "schema.sql");
	const schema = fs.readFileSync(schemaPath, "utf-8");

	return new Promise((resolve, reject) => {
		const database = getDb();
		database.exec(schema, (err) => {
			if (err) {
				reject(err);
				return;
			}
			console.log("[DB] Структура БД создана");
			resolve();
		});
	});
}

/**
 * Закрыть соединение с БД
 */
export function closeDatabase() {
	if (db) {
		db.close();
		db = null;
		console.log("[DB] Соединение закрыто");
	}
}

// CLI инициализация
const args = process.argv.slice(2);
if (args[0] === "init") {
	initDatabase()
		.then(() => initSchema())
		.then(() => {
			console.log("[DB] Инициализация завершена");
			closeDatabase();
			process.exit(0);
		})
		.catch((err) => {
			console.error("[DB] Ошибка инициализации:", err);
			process.exit(1);
		});
}
