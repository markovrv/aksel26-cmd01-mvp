// ============================================
// Axios Client - API коммуникация
// ============================================

import axios from "axios";

// Создаём экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
	baseURL: "/api",
	timeout: 30000,
	withCredentials: true, // Важно для httpOnly cookies
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor - добавляем auth token если есть
apiClient.interceptors.request.use(
	(config) => {
		// Токен берём из sessionStorage для чтения
		// Для записи используется httpOnly cookie на сервере
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor - обработка ошибок
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response) {
			// Сервер вернул ошибку
			const { status, data } = error.response;

			if (status === 401) {
				// Токен истёк или невалиден
				console.warn("[API] Unauthorized - нужно войти");
				// Можно добавить редирект на логин
			}

			return Promise.reject({
				status,
				message: data?.error || "Произошла ошибка",
				data,
			});
		}

		if (error.request) {
			// Запрос ушёл, но ответа нет
			return Promise.reject({
				status: 0,
				message: "Нет соединения с сервером",
			});
		}

		return Promise.reject(error);
	},
);

// ============================================
// Auth API
// ============================================

export const authApi = {
	register: (data) => apiClient.post("/auth/register", data),
	login: (data) => apiClient.post("/auth/login", data),
	logout: () => apiClient.post("/auth/logout"),
	me: () => apiClient.get("/auth/me"),
};

// ============================================
// Enterprises API
// ============================================

export const enterprisesApi = {
	getAll: () => apiClient.get("/enterprises"),
	getById: (id) => apiClient.get(`/enterprises/${id}`),
	getRoutes: (id) => apiClient.get(`/enterprises/${id}/routes`),
};

// ============================================
// Routes API
// ============================================

export const routesApi = {
	getAll: (params) => apiClient.get("/routes", { params }),
	getById: (id) => apiClient.get(`/routes/${id}`),
	getPoints: (id) => apiClient.get(`/routes/${id}/points`),
};

// ============================================
// Sessions API
// ============================================

export const sessionsApi = {
	start: (data) => apiClient.post("/session/start", data),
	getById: (id) => apiClient.get(`/session/${id}`),
	getProgress: (id) => apiClient.get(`/session/${id}/progress`),
	visit: (id, data) => apiClient.post(`/session/${id}/visit`, data),
	complete: (id) => apiClient.post(`/session/${id}/complete`),
};

// ============================================
// Games API
// ============================================

export const gamesApi = {
	getByPointId: (pointId) => apiClient.get(`/games/${pointId}`),
	saveResult: (pointId, data) =>
		apiClient.post(`/games/${pointId}/result`, data),
};

// ============================================
// Certificates API
// ============================================

export const certificatesApi = {
	getByToken: (token) => apiClient.get(`/certificates/${token}`),
};

// ============================================
// Admin API
// ============================================

export const adminApi = {
	getUsers: () => apiClient.get("/admin/users"),
	blockUser: (id) => apiClient.put(`/admin/users/${id}/block`),
	getStats: () => apiClient.get("/admin/stats"),
	getEnterpriseStats: (id) => apiClient.get(`/admin/enterprise/${id}/stats`),
};

export default apiClient;
