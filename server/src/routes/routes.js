// ============================================
// Routes Routes - маршруты экскурсий
// ============================================

import express from "express";
import { dbGet, dbAll, dbRun } from "../db/db.js";
import {
	verifyJWT,
	requireEnterpriseOrAdmin,
	checkBlocked,
} from "../middleware/auth.js";
import {
	uploadCover,
	handleUploadError,
	getFileUrl,
} from "../middleware/upload.js";

const router = express.Router();

// Получить все маршруты (public)
router.get("/", async (req, res) => {
	try {
		const { enterpriseId } = req.query;

		let query = `
            SELECT r.*, e.name as enterprise_name, e.city as enterprise_city,
                   COUNT(p.id) as points_count
            FROM routes r
            JOIN enterprises e ON r.enterprise_id = e.id
            LEFT JOIN points p ON r.id = p.route_id
            WHERE r.is_active = 1
        `;
		const params = [];

		if (enterpriseId) {
			query += " AND r.enterprise_id = ?";
			params.push(enterpriseId);
		}

		query += " GROUP BY r.id ORDER BY r.created_at DESC";

		const routes = await dbAll(query, params);
		res.json(routes);
	} catch (error) {
		console.error("[Routes] Ошибка получения маршрутов:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Получить один маршрут с точками (public)
router.get("/:id", async (req, res) => {
	try {
		const route = await dbGet(
			`
            SELECT r.*, e.name as enterprise_name, e.city as enterprise_city
            FROM routes r
            JOIN enterprises e ON r.enterprise_id = e.id
            WHERE r.id = ?
        `,
			[req.params.id],
		);

		if (!route) {
			return res.status(404).json({ error: "Маршрут не найден." });
		}

		const points = await dbAll(
			`
            SELECT * FROM points
            WHERE route_id = ?
            ORDER BY sort_order ASC
        `,
			[req.params.id],
		);

		res.json({
			...route,
			points,
		});
	} catch (error) {
		console.error("[Routes] Ошибка получения маршрута:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Получить точки маршрута (public)
router.get("/:id/points", async (req, res) => {
	try {
		const points = await dbAll(
			`
            SELECT * FROM points
            WHERE route_id = ?
            ORDER BY sort_order ASC
        `,
			[req.params.id],
		);

		res.json(points);
	} catch (error) {
		console.error("[Routes] Ошибка получения точек:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Создать маршрут (enterprise, admin)
router.post(
	"/",
	verifyJWT,
	requireEnterpriseOrAdmin,
	checkBlocked,
	uploadCover.single("cover"),
	handleUploadError,
	async (req, res) => {
		try {
			const { enterprise_id, title, description } = req.body;

			if (!enterprise_id || !title) {
				return res
					.status(400)
					.json({ error: "Укажите ID предприятия и название маршрута." });
			}

			// Проверяем доступ к предприятию
			const enterprise = await dbGet("SELECT * FROM enterprises WHERE id = ?", [
				enterprise_id,
			]);
			if (!enterprise) {
				return res.status(404).json({ error: "Предприятие не найдено." });
			}

			if (
				req.user.role === "enterprise" &&
				enterprise.owner_id !== req.user.id
			) {
				return res
					.status(403)
					.json({
						error: "Вы не можете создавать маршруты для этого предприятия.",
					});
			}

			const cover_url = req.file ? getFileUrl(req, req.file, "covers") : null;

			const result = await dbRun(
				"INSERT INTO routes (enterprise_id, title, description, cover_url) VALUES (?, ?, ?, ?)",
				[enterprise_id, title, description, cover_url],
			);

			res.status(201).json({
				id: result.lastInsertRowid,
				enterprise_id,
				title,
				description,
				cover_url,
				is_active: 1,
			});
		} catch (error) {
			console.error("[Routes] Ошибка создания маршрута:", error);
			res.status(500).json({ error: "Ошибка сервера." });
		}
	},
);

// Обновить маршрут (owner, admin)
router.put(
	"/:id",
	verifyJWT,
	requireEnterpriseOrAdmin,
	checkBlocked,
	uploadCover.single("cover"),
	handleUploadError,
	async (req, res) => {
		try {
			const { title, description, is_active } = req.body;

			const current = await dbGet("SELECT * FROM routes WHERE id = ?", [
				req.params.id,
			]);
			if (!current) {
				return res.status(404).json({ error: "Маршрут не найден." });
			}

			// Проверяем доступ
			if (req.user.role === "enterprise") {
				const enterprise = await dbGet(
					"SELECT owner_id FROM enterprises WHERE id = ?",
					[current.enterprise_id],
				);
				if (enterprise?.owner_id !== req.user.id) {
					return res
						.status(403)
						.json({ error: "Вы не можете редактировать этот маршрут." });
				}
			}

			const cover_url = req.file
				? getFileUrl(req, req.file, "covers")
				: current.cover_url;

			await dbRun(
				"UPDATE routes SET title = ?, description = ?, cover_url = ?, is_active = ? WHERE id = ?",
				[
					title,
					description,
					cover_url,
					is_active ?? current.is_active,
					req.params.id,
				],
			);

			res.json({
				id: parseInt(req.params.id),
				title,
				description,
				cover_url,
				is_active: is_active ?? current.is_active,
			});
		} catch (error) {
			console.error("[Routes] Ошибка обновления маршрута:", error);
			res.status(500).json({ error: "Ошибка сервера." });
		}
	},
);

// Удалить маршрут (admin)
router.delete("/:id", verifyJWT, async (req, res) => {
	try {
		if (req.user.role !== "admin") {
			return res
				.status(403)
				.json({ error: "Только администратор может удалять маршруты." });
		}

		await dbRun("DELETE FROM routes WHERE id = ?", [req.params.id]);

		res.json({ message: "Маршрут удалён." });
	} catch (error) {
		console.error("[Routes] Ошибка удаления маршрута:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
