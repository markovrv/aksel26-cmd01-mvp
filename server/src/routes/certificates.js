// ============================================
// Certificates Routes - верификация сертификатов
// ============================================

import express from "express";
import { dbGet } from "../db/db.js";

const router = express.Router();

// Получить данные сертификата по токену (public)
router.get("/:token", async (req, res) => {
	try {
		const session = await dbGet(
			`
            SELECT s.*, 
                   e.name as enterprise_name,
                   e.city as enterprise_city,
                   e.industry as enterprise_industry,
                   e.logo_url as enterprise_logo,
                   r.title as route_title
            FROM sessions s
            JOIN enterprises e ON s.enterprise_id = e.id
            JOIN routes r ON s.route_id = r.id
            WHERE s.cert_token = ? AND s.completed_at IS NOT NULL
        `,
			[req.params.token],
		);

		if (!session) {
			return res.status(404).json({
				error: "Сертификат не найден или экскурсия не завершена.",
			});
		}

		// Получаем статистику по играм
		const gameStats = await dbGet(
			`
            SELECT SUM(score) as total_score, COUNT(*) as games_played
            FROM game_results
            WHERE session_id = ?
        `,
			[session.id],
		);

		res.json({
			valid: true,
			certToken: session.cert_token,
			visitorName: session.visitor_name,
			enterprise: {
				name: session.enterprise_name,
				city: session.enterprise_city,
				industry: session.enterprise_industry,
				logo: session.enterprise_logo,
			},
			route: {
				title: session.route_title,
			},
			completedAt: session.completed_at,
			startedAt: session.started_at,
			totalScore: gameStats?.total_score || 0,
			gamesPlayed: gameStats?.games_played || 0,
		});
	} catch (error) {
		console.error("[Certificates] Ошибка получения сертификата:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
