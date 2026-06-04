// ============================================
// Points Routes - точки маршрута (AR-маркеры)
// ============================================

import express from "express";
import { dbGet, dbAll, dbRun } from "../db/db.js";
import {
	verifyJWT,
	requireEnterpriseOrAdmin,
	checkBlocked,
} from "../middleware/auth.js";
import {
	uploadModel,
	uploadAudio,
	handleUploadError,
	getFileUrl,
} from "../middleware/upload.js";

const router = express.Router();

// Получить точку по ID (public)
router.get("/:id", async (req, res) => {
	try {
		const point = await dbGet(
			`
            SELECT p.*, r.title as route_title, r.enterprise_id
            FROM points p
            JOIN routes r ON p.route_id = r.id
            WHERE p.id = ?
        `,
			[req.params.id],
		);

		if (!point) {
			return res.status(404).json({ error: "Точка не найдена." });
		}

		res.json(point);
	} catch (error) {
		console.error("[Points] Ошибка получения точки:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

// Создать точку (enterprise, admin)
router.post(
	"/:routeId/points",
	verifyJWT,
	requireEnterpriseOrAdmin,
	checkBlocked,
	uploadModel.single("model"),
	uploadAudio.single("audio"),
	handleUploadError,
	async (req, res) => {
		try {
			const {
				title,
				description,
				marker_id,
				animation_name,
				game_type,
				game_data,
				sort_order,
			} = req.body;

			if (!title || !marker_id) {
				return res
					.status(400)
					.json({ error: "Укажите название и ID маркера." });
			}

			const route = await dbGet("SELECT * FROM routes WHERE id = ?", [
				req.params.routeId,
			]);
			if (!route) {
				return res.status(404).json({ error: "Маршрут не найден." });
			}

			// Проверяем доступ
			if (req.user.role === "enterprise") {
				const enterprise = await dbGet(
					"SELECT owner_id FROM enterprises WHERE id = ?",
					[route.enterprise_id],
				);
				if (enterprise?.owner_id !== req.user.id) {
					return res
						.status(403)
						.json({ error: "Вы не можете добавлять точки к этому маршруту." });
				}
			}

			const model_url = req.files?.model
				? getFileUrl(req, req.files.model, "models")
				: null;
			const audio_url = req.files?.audio
				? getFileUrl(req, req.files.audio, "audio")
				: null;

			// Получаем следующий порядковый номер
			const maxOrder = await dbGet(
				"SELECT MAX(sort_order) as max FROM points WHERE route_id = ?",
				[req.params.routeId],
			);
			const nextOrder = sort_order ?? (maxOrder?.max ?? 0) + 1;

			const result = await dbRun(
				`
                INSERT INTO points (route_id, sort_order, title, description, marker_id, model_url, audio_url, animation_name, game_type, game_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
				[
					req.params.routeId,
					nextOrder,
					title,
					description,
					marker_id,
					model_url,
					audio_url,
					animation_name || "idle",
					game_type || null,
					game_data || null,
				],
			);

			res.status(201).json({
				id: result.lastInsertRowid,
				route_id: parseInt(req.params.routeId),
				sort_order: nextOrder,
				title,
				description,
				marker_id,
				model_url,
				audio_url,
				animation_name: animation_name || "idle",
				game_type,
				game_data,
			});
		} catch (error) {
			console.error("[Points] Ошибка создания точки:", error);
			res.status(500).json({ error: "Ошибка сервера." });
		}
	},
);

// Обновить точку (owner, admin)
router.put(
	"/:id",
	verifyJWT,
	requireEnterpriseOrAdmin,
	checkBlocked,
	uploadModel.single("model"),
	uploadAudio.single("audio"),
	handleUploadError,
	async (req, res) => {
		try {
			const {
				title,
				description,
				marker_id,
				animation_name,
				game_type,
				game_data,
				sort_order,
			} = req.body;

			const current = await dbGet("SELECT * FROM points WHERE id = ?", [
				req.params.id,
			]);
			if (!current) {
				return res.status(404).json({ error: "Точка не найдена." });
			}

			// Проверяем доступ
			const route = await dbGet("SELECT * FROM routes WHERE id = ?", [
				current.route_id,
			]);
			if (req.user.role === "enterprise") {
				const enterprise = await dbGet(
					"SELECT owner_id FROM enterprises WHERE id = ?",
					[route.enterprise_id],
				);
				if (enterprise?.owner_id !== req.user.id) {
					return res
						.status(403)
						.json({ error: "Вы не можете редактировать эту точку." });
				}
			}

			const model_url = req.files?.model
				? getFileUrl(req, req.files.model, "models")
				: current.model_url;
			const audio_url = req.files?.audio
				? getFileUrl(req, req.files.audio, "audio")
				: current.audio_url;

			await dbRun(
				`
                UPDATE points SET 
                    title = ?, description = ?, marker_id = ?, 
                    model_url = ?, audio_url = ?, animation_name = ?,
                    game_type = ?, game_data = ?, sort_order = ?
                WHERE id = ?
            `,
				[
					title,
					description,
					marker_id,
					model_url,
					audio_url,
					animation_name || current.animation_name,
					game_type ?? current.game_type,
					game_data ?? current.game_data,
					sort_order ?? current.sort_order,
					req.params.id,
				],
			);

			res.json({
				id: parseInt(req.params.id),
				title,
				description,
				marker_id,
				model_url,
				audio_url,
				animation_name: animation_name || current.animation_name,
				game_type,
				game_data,
				sort_order: sort_order ?? current.sort_order,
			});
		} catch (error) {
			console.error("[Points] Ошибка обновления точки:", error);
			res.status(500).json({ error: "Ошибка сервера." });
		}
	},
);

// Удалить точку (admin)
router.delete("/:id", verifyJWT, async (req, res) => {
	try {
		if (req.user.role !== "admin") {
			return res
				.status(403)
				.json({ error: "Только администратор может удалять точки." });
		}

		await dbRun("DELETE FROM points WHERE id = ?", [req.params.id]);

		res.json({ message: "Точка удалена." });
	} catch (error) {
		console.error("[Points] Ошибка удаления точки:", error);
		res.status(500).json({ error: "Ошибка сервера." });
	}
});

export default router;
