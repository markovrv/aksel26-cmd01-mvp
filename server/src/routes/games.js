// ============================================
// Games Routes - игровые данные и результаты
// ============================================

import express from "express";
import { dbGet, dbAll, dbRun } from "../db/db.js";

const router = express.Router();

// Получить данные игры для точки (public)
router.get("/:pointId", async (req, res) => {
	try {
		const point = await dbGet(
			`
            SELECT id, game_type, game_data, title
            FROM points
            WHERE id = ?
        `,
			[req.params.pointId],
		);

		if (!point) {
			return res.status(404).json({ error: "Точка не найдена." });
		}

		if (!point.game_type) {
			return res.status(404).json({ error: "На этой точке нет игры." });
		}

		// Парсим JSON game_data если есть
		let gameData = null;
		if (point.game_data) {
			try {
				gameData = JSON.parse(point.game_data);
			} catch (e) {
				console.error("[Games] Ошибка парсинга game_data:", e);
			}
		}

		res.json({
			pointId: point.id,
			pointTitle: point.title,
			gameType: point.game_type,
			gameData,
		});
	} catch (error) {
		console.error("[Games] Ошибка получения игры:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Сохранить результат игры (public)
router.post("/:pointId/result", async (req, res) => {
	try {
		const { sessionId, score, maxScore, timeSec } = req.body;

		if (!sessionId || score === undefined) {
			return res.status(400).json({ error: "Укажите ID сессии и результат." });
		}

		const point = await dbGet("SELECT id, game_type FROM points WHERE id = ?", [
			req.params.pointId,
		]);
		if (!point) {
			return res.status(404).json({ error: "Точка не найдена." });
		}

		const session = await dbGet("SELECT id FROM sessions WHERE id = ?", [
			sessionId,
		]);
		if (!session) {
			return res.status(404).json({ error: "Сессия не найдена." });
		}

		// Сохраняем результат игры
		const result = await dbRun(
			`
            INSERT INTO game_results (session_id, point_id, game_type, score, max_score, time_sec)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
			[
				sessionId,
				req.params.pointId,
				point.game_type,
				score,
				maxScore || 0,
				timeSec || 0,
			],
		);

		// Также обновляем балл в session_visits
		await dbRun(
			"UPDATE session_visits SET game_score = ? WHERE session_id = ? AND point_id = ?",
			[score, sessionId, req.params.pointId],
		);

		res.status(201).json({
			id: result.lastInsertRowid,
			sessionId,
			pointId: parseInt(req.params.pointId),
			score,
			maxScore: maxScore || 0,
			timeSec: timeSec || 0,
		});
	} catch (error) {
		console.error("[Games] Ошибка сохранения результата:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Получить историю игр сессии (public)
router.get("/session/:sessionId", async (req, res) => {
	try {
		const results = await dbAll(
			`
            SELECT gr.*, p.title as point_title
            FROM game_results gr
            JOIN points p ON gr.point_id = p.id
            WHERE gr.session_id = ?
            ORDER BY gr.played_at ASC
        `,
			[req.params.sessionId],
		);

		res.json(results);
	} catch (error) {
		console.error("[Games] Ошибка получения истории игр:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
