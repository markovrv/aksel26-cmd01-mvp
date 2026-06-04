// ============================================
// Enterprises Routes - CRUD для предприятий
// ============================================

import express from "express";
import { dbGet, dbAll, dbRun } from "../db/db.js";
import {
	verifyJWT,
	requireEnterpriseOrAdmin,
	requireEnterpriseOwner,
	checkBlocked,
} from "../middleware/auth.js";
import {
	uploadLogo,
	handleUploadError,
	getFileUrl,
} from "../middleware/upload.js";

const router = express.Router();

// Получить список всех предприятий (public)
router.get("/", async (req, res) => {
	try {
		const enterprises = await dbAll(`
            SELECT e.*, u.name as owner_name
            FROM enterprises e
            LEFT JOIN users u ON e.owner_id = u.id
            ORDER BY e.created_at DESC
        `);

		res.json(enterprises);
	} catch (error) {
		console.error("[Enterprises] Ошибка получения списка:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Получить одно предприятие (public)
router.get("/:id", async (req, res) => {
	try {
		const enterprise = await dbGet(
			`
            SELECT e.*, u.name as owner_name
            FROM enterprises e
            LEFT JOIN users u ON e.owner_id = u.id
            WHERE e.id = ?
        `,
			[req.params.id],
		);

		if (!enterprise) {
			return res.status(404).json({ error: "Предприятие не найдено." });
		}

		res.json(enterprise);
	} catch (error) {
		console.error("[Enterprises] Ошибка получения предприятия:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Получить маршруты предприятия (public)
router.get("/:id/routes", async (req, res) => {
	try {
		const enterprise = await dbGet("SELECT id FROM enterprises WHERE id = ?", [
			req.params.id,
		]);

		if (!enterprise) {
			return res.status(404).json({ error: "Предприятие не найдено." });
		}

		const routes = await dbAll(
			`
            SELECT r.*, COUNT(p.id) as points_count
            FROM routes r
            LEFT JOIN points p ON r.id = p.route_id
            WHERE r.enterprise_id = ? AND r.is_active = 1
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `,
			[req.params.id],
		);

		res.json(routes);
	} catch (error) {
		console.error("[Enterprises] Ошибка получения маршрутов:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Создать предприятие (enterprise, admin)
router.post(
	"/",
	verifyJWT,
	requireEnterpriseOrAdmin,
	checkBlocked,
	uploadLogo.single("logo"),
	handleUploadError,
	async (req, res) => {
		try {
			const { name, industry, city, description } = req.body;

			if (!name || !industry || !city) {
				return res
					.status(400)
					.json({
						error: "Заполните обязательные поля: название, отрасль, город.",
					});
			}

			const logo_url = req.file ? getFileUrl(req, req.file, "logos") : null;

			const result = await dbRun(
				"INSERT INTO enterprises (name, industry, city, description, logo_url, owner_id) VALUES (?, ?, ?, ?, ?, ?)",
				[name, industry, city, description, logo_url, req.user.id],
			);

			res.status(201).json({
				id: result.lastInsertRowid,
				name,
				industry,
				city,
				description,
				logo_url,
				owner_id: req.user.id,
			});
		} catch (error) {
			console.error("[Enterprises] Ошибка создания:", error);
			res.status(500).json({ error: "Ошибка сервера." });
		}
	},
);

// Обновить предприятие (owner, admin)
router.put(
	"/:id",
	verifyJWT,
	requireEnterpriseOwner,
	checkBlocked,
	uploadLogo.single("logo"),
	handleUploadError,
	async (req, res) => {
		try {
			const { name, industry, city, description } = req.body;

			if (!name || !industry || !city) {
				return res.status(400).json({ error: "Заполните обязательные поля." });
			}

			const current = await dbGet(
				"SELECT logo_url FROM enterprises WHERE id = ?",
				[req.params.id],
			);

			const logo_url = req.file
				? getFileUrl(req, req.file, "logos")
				: current?.logo_url;

			await dbRun(
				"UPDATE enterprises SET name = ?, industry = ?, city = ?, description = ?, logo_url = ? WHERE id = ?",
				[name, industry, city, description, logo_url, req.params.id],
			);

			res.json({
				id: parseInt(req.params.id),
				name,
				industry,
				city,
				description,
				logo_url,
			});
		} catch (error) {
			console.error("[Enterprises] Ошибка обновления:", error);
			res.status(500).json({ error: "Ошибка сервера." });
		}
	},
);

// Удалить предприятие (admin)
router.delete("/:id", verifyJWT, async (req, res) => {
	try {
		if (req.user.role !== "admin") {
			return res
				.status(403)
				.json({ error: "Только администратор может удалять предприятия." });
		}

		await dbRun("DELETE FROM enterprises WHERE id = ?", [req.params.id]);

		res.json({ message: "Предприятие удалено." });
	} catch (error) {
		console.error("[Enterprises] Ошибка удаления:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
