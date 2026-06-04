// ============================================
// Admin Routes - панель администратора
// ============================================

import express from "express";
import { dbGet, dbAll, dbRun } from "../db/db.js";
import { verifyJWT, requireAdmin, checkBlocked } from "../middleware/auth.js";

const router = express.Router();

// Все middleware требуют авторизации и роли admin
router.use(verifyJWT, requireAdmin, checkBlocked);

// Получить список пользователей
router.get("/users", async (req, res) => {
	try {
		const users = await dbAll(`
            SELECT id, name, email, role, is_blocked, created_at
            FROM users
            ORDER BY created_at DESC
        `);

		res.json(users);
	} catch (error) {
		console.error("[Admin] Ошибка получения пользователей:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Заблокировать/разблокировать пользователя
router.put("/users/:id/block", async (req, res) => {
	try {
		const userId = parseInt(req.params.id);

		// Нельзя заблокировать себя
		if (userId === req.user.id) {
			return res.status(400).json({ error: "Нельзя заблокировать себя." });
		}

		const user = await dbGet("SELECT is_blocked FROM users WHERE id = ?", [
			userId,
		]);
		if (!user) {
			return res.status(404).json({ error: "Пользователь не найден." });
		}

		const newStatus = user.is_blocked ? 0 : 1;
		await dbRun("UPDATE users SET is_blocked = ? WHERE id = ?", [
			newStatus,
			userId,
		]);

		res.json({
			userId,
			isBlocked: newStatus === 1,
			message: newStatus
				? "Пользователь заблокирован."
				: "Пользователь разблокирован.",
		});
	} catch (error) {
		console.error("[Admin] Ошибка блокировки:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Статистика платформы
router.get("/stats", async (req, res) => {
	try {
		// Общая статистика
		const totalSessions = await dbGet("SELECT COUNT(*) as count FROM sessions");
		const completedSessions = await dbGet(
			"SELECT COUNT(*) as count FROM sessions WHERE completed_at IS NOT NULL",
		);

		// Статистика по предприятиям
		const enterprisesCount = await dbGet(
			"SELECT COUNT(*) as count FROM enterprises",
		);
		const routesCount = await dbGet("SELECT COUNT(*) as count FROM routes");
		const pointsCount = await dbGet("SELECT COUNT(*) as count FROM points");

		// Пользователи
		const usersCount = await dbGet("SELECT COUNT(*) as count FROM users");
		const enterprisesUsers = await dbGet(
			"SELECT COUNT(*) as count FROM users WHERE role = 'enterprise'",
		);

		// Средний процент завершения
		const avgCompletion = await dbGet(`
            SELECT AVG(CAST(visited_count AS FLOAT) / NULLIF(total_points, 0) * 100) as avg
            FROM (
                SELECT s.id,
                       (SELECT COUNT(*) FROM session_visits WHERE session_id = s.id) as visited_count,
                       (SELECT COUNT(*) FROM points WHERE route_id = s.route_id) as total_points
                FROM sessions s
            )
        `);

		// Топ маршруты по сессиям
		const topRoutes = await dbAll(`
            SELECT r.title, e.name as enterprise, COUNT(s.id) as sessions_count
            FROM routes r
            JOIN enterprises e ON r.enterprise_id = e.id
            LEFT JOIN sessions s ON r.id = s.route_id
            GROUP BY r.id
            ORDER BY sessions_count DESC
            LIMIT 5
        `);

		// Последние сессии
		const recentSessions = await dbAll(`
            SELECT s.id, s.visitor_name, s.started_at, s.completed_at, 
                   e.name as enterprise, r.title as route
            FROM sessions s
            JOIN enterprises e ON s.enterprise_id = e.id
            JOIN routes r ON s.route_id = r.id
            ORDER BY s.started_at DESC
            LIMIT 10
        `);

		res.json({
			sessions: {
				total: totalSessions?.count || 0,
				completed: completedSessions?.count || 0,
				completionRate:
					totalSessions?.count > 0
						? Math.round(
								(completedSessions?.count / totalSessions?.count) * 100,
							)
						: 0,
			},
			content: {
				enterprises: enterprisesCount?.count || 0,
				routes: routesCount?.count || 0,
				points: pointsCount?.count || 0,
			},
			users: {
				total: usersCount?.count || 0,
				enterprises: enterprisesUsers?.count || 0,
			},
			avgCompletion: Math.round(avgCompletion?.avg || 0),
			topRoutes,
			recentSessions,
		});
	} catch (error) {
		console.error("[Admin] Ошибка получения статистики:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Статистика для конкретного предприятия
router.get("/enterprise/:id/stats", async (req, res) => {
	try {
		const enterpriseId = req.params.id;

		// Общая статистика
		const sessions = await dbAll(
			`
            SELECT s.*, r.title as route_title
            FROM sessions s
            JOIN routes r ON s.route_id = r.id
            WHERE s.enterprise_id = ?
            ORDER BY s.started_at DESC
        `,
			[enterpriseId],
		);

		const totalSessions = sessions.length;
		const completedSessions = sessions.filter((s) => s.completed_at).length;

		// Топ точки
		const topPoints = await dbAll(
			`
            SELECT p.title, COUNT(sv.id) as visit_count, AVG(sv.game_score) as avg_score
            FROM points p
            JOIN session_visits sv ON p.id = sv.point_id
            WHERE p.route_id IN (SELECT id FROM routes WHERE enterprise_id = ?)
            GROUP BY p.id
            ORDER BY visit_count DESC
            LIMIT 5
        `,
			[enterpriseId],
		);

		// Средний балл
		const avgScore = await dbGet(
			`
            SELECT AVG(game_score) as avg FROM session_visits
            WHERE session_id IN (SELECT id FROM sessions WHERE enterprise_id = ?)
        `,
			[enterpriseId],
		);

		res.json({
			totalSessions,
			completedSessions,
			completionRate:
				totalSessions > 0
					? Math.round((completedSessions / totalSessions) * 100)
					: 0,
			avgScore: Math.round(avgScore?.avg || 0),
			topPoints,
			recentSessions: sessions.slice(0, 10),
		});
	} catch (error) {
		console.error("[Admin] Ошибка получения статистики предприятия:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
