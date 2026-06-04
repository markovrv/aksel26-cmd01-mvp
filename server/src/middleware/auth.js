// ============================================
// Middleware аутентификации и авторизации
// JWT verification через httpOnly cookie
// ============================================

import jwt from "jsonwebtoken";
import { dbGet } from "../db/db.js";

const JWT_SECRET =
	process.env.JWT_SECRET || "change_me_in_production_min32chars";

/**
 * Проверка JWT токена из cookie
 */
export function verifyJWT(req, res, next) {
	const token = req.cookies.token;

	if (!token) {
		return res
			.status(401)
			.json({ error: "Не авторизован. Войдите в систему." });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			return res.status(401).json({ error: "Сессия истекла. Войдите снова." });
		}
		return res.status(401).json({ error: "Недействительный токен." });
	}
}

/**
 * Проверка роли admin
 */
export function requireAdmin(req, res, next) {
	if (req.user.role !== "admin") {
		return res
			.status(403)
			.json({ error: "Доступ только для администраторов." });
	}
	next();
}

/**
 * Проверка роли enterprise или admin
 */
export function requireEnterpriseOrAdmin(req, res, next) {
	if (req.user.role !== "enterprise" && req.user.role !== "admin") {
		return res
			.status(403)
			.json({ error: "Доступ только для представителей предприятий." });
	}
	next();
}

/**
 * Проверка блокировки пользователя
 */
export async function checkBlocked(req, res, next) {
	const user = await dbGet("SELECT is_blocked FROM users WHERE id = ?", [
		req.user.id,
	]);

	if (user && user.is_blocked) {
		return res.status(403).json({ error: "Аккаунт заблокирован." });
	}

	next();
}

/**
 * Middleware для проверки владельца предприятия
 */
export async function requireEnterpriseOwner(req, res, next) {
	if (req.user.role === "admin") {
		return next();
	}

	const enterpriseId = req.params.id || req.body.enterpriseId;

	if (!enterpriseId) {
		return res.status(400).json({ error: "Не указан ID предприятия." });
	}

	const enterprise = await dbGet(
		"SELECT owner_id FROM enterprises WHERE id = ?",
		[enterpriseId],
	);

	if (!enterprise) {
		return res.status(404).json({ error: "Предприятие не найдено." });
	}

	if (enterprise.owner_id !== req.user.id) {
		return res
			.status(403)
			.json({ error: "Вы не являетесь владельцем этого предприятия." });
	}

	next();
}
