// ============================================
// Auth Routes - регистрация, вход, выход
// ============================================

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { dbGet, dbRun } from "../db/db.js";
import { verifyJWT, checkBlocked } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET =
	process.env.JWT_SECRET || "change_me_in_production_min32chars";
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || "ARGUIDE-ADMIN-2026";
const SALT_ROUNDS = 12;

// Регистрация пользователя
router.post("/register", async (req, res) => {
	try {
		const { name, email, password, inviteCode } = req.body;

		// Валидация
		if (!name || !email || !password) {
			return res
				.status(400)
				.json({ error: "Заполните все обязательные поля." });
		}

		if (password.length < 6) {
			return res
				.status(400)
				.json({ error: "Пароль должен быть минимум 6 символов." });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Некорректный email." });
		}

		// Проверяем существование email
		const existing = await dbGet("SELECT id FROM users WHERE email = ?", [
			email,
		]);
		if (existing) {
			return res.status(400).json({ error: "Email уже зарегистрирован." });
		}

		// Определяем роль
		let role = "enterprise";
		if (inviteCode === ADMIN_INVITE_CODE) {
			role = "admin";
		}

		// Хешируем пароль
		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		// Создаём пользователя
		const result = await dbRun(
			"INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
			[name, email, hashedPassword, role],
		);

		// Генерируем JWT
		const token = jwt.sign({ id: result.lastInsertRowid, role }, JWT_SECRET, {
			expiresIn: "7d",
		});

		// Устанавливаем cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
		});

		res.status(201).json({
			id: result.lastInsertRowid,
			name,
			email,
			role,
		});
	} catch (error) {
		console.error("[Auth] Ошибка регистрации:", error);
		res.status(500).json({ error: "Ошибка сервера при регистрации." });
	}
});

// Вход пользователя
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Введите email и пароль." });
		}

		// Находим пользователя
		const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);

		if (!user) {
			return res.status(401).json({ error: "Неверный email или пароль." });
		}

		if (user.is_blocked) {
			return res.status(403).json({ error: "Аккаунт заблокирован." });
		}

		// Проверяем пароль
		const isValid = await bcrypt.compare(password, user.password);

		if (!isValid) {
			return res.status(401).json({ error: "Неверный email или пароль." });
		}

		// Генерируем JWT
		const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
			expiresIn: "7d",
		});

		// Устанавливаем httpOnly cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.json({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.error("[Auth] Ошибка входа:", error);
		res.status(500).json({ error: "Ошибка сервера при входе." });
	}
});

// Выход
router.post("/logout", (req, res) => {
	res.clearCookie("token");
	res.json({ message: "Вы вышли из системы." });
});

// Текущий пользователь
router.get("/me", verifyJWT, checkBlocked, async (req, res) => {
	try {
		const user = await dbGet(
			"SELECT id, name, email, role, created_at FROM users WHERE id = ?",
			[req.user.id],
		);

		if (!user) {
			return res.status(404).json({ error: "Пользователь не найден." });
		}

		res.json(user);
	} catch (error) {
		console.error("[Auth] Ошибка получения профиля:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
