// ============================================
// Session Store - Zustand store для сессии гостя
// ============================================

import { create } from "zustand";
import { sessionsApi } from "../api/client";

const SESSION_STORAGE_KEY = "ar_guide_session";

export const useSessionStore = create((set, get) => ({
	// Состояние
	sessionId: null,
	visitorName: "",
	enterpriseId: null,
	routeId: null,
	visitedPointIds: [],
	totalPoints: 0,
	totalScore: 0,
	isLoading: false,
	error: null,

	// Инициализация из sessionStorage
	initFromStorage: () => {
		try {
			const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
			if (stored) {
				const data = JSON.parse(stored);
				set({
					sessionId: data.sessionId || null,
					visitorName: data.visitorName || "",
					enterpriseId: data.enterpriseId || null,
					routeId: data.routeId || null,
					visitedPointIds: data.visitedPointIds || [],
					totalPoints: data.totalPoints || 0,
					totalScore: data.totalScore || 0,
				});
				return true;
			}
		} catch (e) {
			console.error("[SessionStore] Ошибка чтения из storage:", e);
		}
		return false;
	},

	// Сохранение в sessionStorage
	saveToStorage: () => {
		const state = get();
		try {
			sessionStorage.setItem(
				SESSION_STORAGE_KEY,
				JSON.stringify({
					sessionId: state.sessionId,
					visitorName: state.visitorName,
					enterpriseId: state.enterpriseId,
					routeId: state.routeId,
					visitedPointIds: state.visitedPointIds,
					totalPoints: state.totalPoints,
					totalScore: state.totalScore,
				}),
			);
		} catch (e) {
			console.error("[SessionStore] Ошибка записи в storage:", e);
		}
	},

	// Начать сессию
	startSession: async (visitorName, enterpriseId, routeId) => {
		set({ isLoading: true, error: null });

		try {
			const response = await sessionsApi.start({
				visitorName,
				enterpriseId,
				routeId,
			});
			const { sessionId } = response.data;

			set({
				sessionId,
				visitorName,
				enterpriseId,
				routeId,
				visitedPointIds: [],
				totalPoints: 0,
				totalScore: 0,
				isLoading: false,
			});

			get().saveToStorage();
			return sessionId;
		} catch (error) {
			set({
				isLoading: false,
				error: error.message || "Ошибка начала сессии",
			});
			throw error;
		}
	},

	// Загрузить прогресс с сервера
	loadProgress: async () => {
		const { sessionId } = get();
		if (!sessionId) return null;

		try {
			const response = await sessionsApi.getProgress(sessionId);
			const { visited, total, totalScore } = response.data;

			set({
				visitedPointIds: visited,
				totalPoints: total,
				totalScore,
			});

			get().saveToStorage();
			return response.data;
		} catch (error) {
			console.error("[SessionStore] Ошибка загрузки прогресса:", error);
			return null;
		}
	},

	// Отметить посещение точки
	markVisited: async (pointId, gameScore = 0) => {
		const { sessionId, visitedPointIds } = get();
		if (!sessionId) return;

		// Если уже посещена, пропускаем
		if (visitedPointIds.includes(pointId)) {
			return { alreadyVisited: true };
		}

		try {
			await sessionsApi.visit(sessionId, { pointId, gameScore });

			const newVisited = [...visitedPointIds, pointId];
			const newScore = get().totalScore + gameScore;

			set({
				visitedPointIds: newVisited,
				totalScore: newScore,
			});

			get().saveToStorage();
			return {
				success: true,
				allVisited: newVisited.length === get().totalPoints,
			};
		} catch (error) {
			console.error("[SessionStore] Ошибка отметки посещения:", error);
			throw error;
		}
	},

	// Завершить сессию
	completeSession: async () => {
		const { sessionId } = get();
		if (!sessionId) throw new Error("Нет активной сессии");

		try {
			const response = await sessionsApi.complete(sessionId);
			return response.data;
		} catch (error) {
			console.error("[SessionStore] Ошибка завершения сессии:", error);
			throw error;
		}
	},

	// Очистить сессию
	clearSession: () => {
		sessionStorage.removeItem(SESSION_STORAGE_KEY);
		set({
			sessionId: null,
			visitorName: "",
			enterpriseId: null,
			routeId: null,
			visitedPointIds: [],
			totalPoints: 0,
			totalScore: 0,
			error: null,
		});
	},

	// Проверка, посещена ли точка
	isPointVisited: (pointId) => {
		return get().visitedPointIds.includes(pointId);
	},

	// Геттеры
	getProgress: () => {
		const { visitedPointIds, totalPoints } = get();
		return {
			visited: visitedPointIds.length,
			total: totalPoints,
			percent:
				totalPoints > 0
					? Math.round((visitedPointIds.length / totalPoints) * 100)
					: 0,
		};
	},
}));

export default useSessionStore;
