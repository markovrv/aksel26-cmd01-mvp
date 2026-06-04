// ============================================
// Sessions Routes - сессии посетителей
// ============================================

import express from "express";
import { dbGet, dbAll, dbRun } from "../db/db.js";
import { generateCertToken } from "../services/certService.js";

const router = express.Router();

// Начать сессию (public) - ограничение rate limit применяется в index.js
router.post("/start", async (req, res) => {
	try {
		const { visitorName, enterpriseId, routeId } = req.body;

		if (!visitorName || !enterpriseId || !routeId) {
			return res
				.status(400)
				.json({ error: "Укажите имя, ID предприятия и маршрута." });
		}

		if (visitorName.length < 2) {
			return res
				.status(400)
				.json({ error: "Имя должно содержать минимум 2 символа." });
		}

		// Проверяем существование предприятия и маршрута
		const enterprise = await dbGet("SELECT id FROM enterprises WHERE id = ?", [
			enterpriseId,
		]);
		if (!enterprise) {
			return res.status(404).json({ error: "Предприятие не найдено." });
		}

		const route = await dbGet(
			"SELECT id FROM routes WHERE id = ? AND enterprise_id = ?",
			[routeId, enterpriseId],
		);
		if (!route) {
			return res
				.status(404)
				.json({ error: "Маршрут не найден для этого предприятия." });
		}

		// Создаём сессию
		const result = await dbRun(
			"INSERT INTO sessions (visitor_name, enterprise_id, route_id) VALUES (?, ?, ?)",
			[visitorName, enterpriseId, routeId],
		);

		const sessionId = result.lastInsertRowid;

		res.status(201).json({
			sessionId,
			visitorName,
			enterpriseId,
			routeId,
			startedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Sessions] Ошибка создания сессии:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Получить данные сессии (public)
router.get("/:id", async (req, res) => {
	try {
		const session = await dbGet(
			`
            SELECT s.*, e.name as enterprise_name, r.title as route_title
            FROM sessions s
            JOIN enterprises e ON s.enterprise_id = e.id
            JOIN routes r ON s.route_id = r.id
            WHERE s.id = ?
        `,
			[req.params.id],
		);

		if (!session) {
			return res.status(404).json({ error: "Сессия не найдена." });
		}

		res.json(session);
	} catch (error) {
		console.error("[Sessions] Ошибка получения сессии:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Получить прогресс сессии (public)
router.get("/:id/progress", async (req, res) => {
	try {
		const session = await dbGet("SELECT * FROM sessions WHERE id = ?", [
			req.params.id,
		]);

		if (!session) {
			return res.status(404).json({ error: "Сессия не найдена." });
		}

		// Получаем все точки маршрута
		const totalPoints = await dbGet(
			`
            SELECT COUNT(*) as count FROM points WHERE route_id = ?
        `,
			[session.route_id],
		);

		// Получаем посещённые точки
		const visitedPoints = await dbAll(
			`
            SELECT sv.*, p.title as point_title, p.marker_id
            FROM session_visits sv
            JOIN points p ON sv.point_id = p.id
            WHERE sv.session_id = ?
            ORDER BY sv.visited_at ASC
        `,
			[req.params.id],
		);

		const visitedIds = visitedPoints.map((v) => v.point_id);
		const visitedCount = visitedIds.length;
		const totalCount = totalPoints?.count || 0;
		const percent =
			totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

		// Получаем суммарный балл
		const scoreData = await dbGet(
			`
            SELECT SUM(game_score) as total_score
            FROM session_visits
            WHERE session_id = ?
        `,
			[req.params.id],
		);

		res.json({
			sessionId: parseInt(req.params.id),
			visitorName: session.visitor_name,
			routeId: session.route_id,
			visited: visitedIds,
			visitedDetails: visitedPoints,
			total: totalCount,
			visitedCount,
			percent,
			totalScore: scoreData?.total_score || 0,
			completed: session.completed_at !== null,
			certToken: session.cert_token,
		});
	} catch (error) {
		console.error("[Sessions] Ошибка получения прогресса:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Отметить посещение точки (public)
router.post("/:id/visit", async (req, res) => {
	try {
		const { pointId, gameScore } = req.body;

		if (!pointId) {
			return res.status(400).json({ error: "Укажите ID точки." });
		}

		const session = await dbGet("SELECT * FROM sessions WHERE id = ?", [
			req.params.id,
		]);
		if (!session) {
			return res.status(404).json({ error: "Сессия не найдена." });
		}

		if (session.completed_at) {
			return res.status(400).json({ error: "Сессия уже завершена." });
		}

		// Проверяем существование точки
		const point = await dbGet(
			"SELECT * FROM points WHERE id = ? AND route_id = ?",
			[pointId, session.route_id],
		);
		if (!point) {
			return res
				.status(404)
				.json({ error: "Точка не найдена в этом маршруте." });
		}

		// Проверяем, не посещена ли уже
		const existing = await dbGet(
			"SELECT id FROM session_visits WHERE session_id = ? AND point_id = ?",
			[req.params.id, pointId],
		);

		if (existing) {
			// Обновляем балл если передан новый
			if (gameScore !== undefined && gameScore !== null) {
				await dbRun(
					"UPDATE session_visits SET game_score = ? WHERE session_id = ? AND point_id = ?",
					[gameScore, req.params.id, pointId],
				);
			}
			return res.json({ message: "Точка уже посещена.", updated: true });
		}

		// Создаём запись о посещении
		const result = await dbRun(
			"INSERT INTO session_visits (session_id, point_id, game_score) VALUES (?, ?, ?)",
			[req.params.id, pointId, gameScore || 0],
		);

		// Проверяем, все ли точки пройдены
		const totalPoints = await dbGet(
			"SELECT COUNT(*) as count FROM points WHERE route_id = ?",
			[session.route_id],
		);
		const visitedCount = await dbGet(
			"SELECT COUNT(*) as count FROM session_visits WHERE session_id = ?",
			[req.params.id],
		);

		const allPointsVisited = visitedCount?.count >= totalPoints?.count;

		res.status(201).json({
			id: result.lastInsertRowid,
			sessionId: parseInt(req.params.id),
			pointId,
			gameScore: gameScore || 0,
			allPointsVisited,
			visitedCount: visitedCount?.count,
			totalPoints: totalPoints?.count,
		});
	} catch (error) {
		console.error("[Sessions] Ошибка отметки посещения:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Завершить сессию и получить сертификат (public)
router.post("/:id/complete", async (req, res) => {
	try {
		const session = await dbGet("SELECT * FROM sessions WHERE id = ?", [
			req.params.id,
		]);

		if (!session) {
			return res.status(404).json({ error: "Сессия не найдена." });
		}

		// Проверяем прогресс
		const totalPoints = await dbGet(
			"SELECT COUNT(*) as count FROM points WHERE route_id = ?",
			[session.route_id],
		);
		const visitedCount = await dbGet(
			"SELECT COUNT(*) as count FROM session_visits WHERE session_id = ?",
			[req.params.id],
		);

		if (visitedCount?.count < totalPoints?.count) {
			return res.status(400).json({
				error: "Нельзя завершить экскурсию без прохождения всех точек.",
				visited: visitedCount?.count,
				total: totalPoints?.count,
			});
		}

		// Генерируем токен сертификата
		const certToken = generateCertToken();

		// Обновляем сессию
		await dbRun(
			'UPDATE sessions SET completed_at = datetime("now"), cert_token = ? WHERE id = ?',
			[certToken, req.params.id],
		);

		res.json({
			certToken,
			message: "Экскурсия успешно пройдена!",
			completedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Sessions] Ошибка завершения сессии:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
