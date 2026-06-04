// ============================================
// Auth Store - Zustand store для авторизации enterprise/admin
// ============================================

import { create } from "zustand";
import { authApi } from "../api/client";

const AUTH_STORAGE_KEY = "ar_guide_auth";

export const useAuthStore = create((set, get) => ({
	// Состояние
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,

	// Инициализация из storage
	initFromStorage: async () => {
		try {
			const response = await authApi.me();
			set({
				user: response.data,
				isAuthenticated: true,
			});
			return true;
		} catch (error) {
			// Пользователь не авторизован или токен истёк
			set({ user: null, isAuthenticated: false });
			return false;
		}
	},

	// Вход
	login: async (email, password) => {
		set({ isLoading: true, error: null });

		try {
			const response = await authApi.login({ email, password });
			set({
				user: response.data,
				isAuthenticated: true,
				isLoading: false,
			});
			return response.data;
		} catch (error) {
			set({
				isLoading: false,
				error: error.message || "Ошибка входа",
			});
			throw error;
		}
	},

	// Регистрация
	register: async (name, email, password, inviteCode) => {
		set({ isLoading: true, error: null });

		try {
			const response = await authApi.register({
				name,
				email,
				password,
				inviteCode,
			});
			set({
				user: response.data,
				isAuthenticated: true,
				isLoading: false,
			});
			return response.data;
		} catch (error) {
			set({
				isLoading: false,
				error: error.message || "Ошибка регистрации",
			});
			throw error;
		}
	},

	// Выход
	logout: async () => {
		try {
			await authApi.logout();
		} catch (error) {
			console.error("[AuthStore] Ошибка выхода:", error);
		}

		set({
			user: null,
			isAuthenticated: false,
			error: null,
		});
	},

	// Очистка ошибки
	clearError: () => set({ error: null }),

	// Проверка роли
	hasRole: (role) => {
		const { user } = get();
		return user?.role === role;
	},

	isAdmin: () => get().user?.role === "admin",
	isEnterprise: () => get().user?.role === "enterprise",
}));

export default useAuthStore;
