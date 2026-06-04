// ============================================
// Тесты для authStore
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider } from "../store/authStore";

// Мок sessionStorage
const mockSessionStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
};

Object.defineProperty(global, "sessionStorage", {
	value: mockSessionStorage,
});

describe("authStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSessionStorage.getItem.mockReturnValue(null);
	});

	it("должен возвращать isAuthenticated = false по умолчанию", () => {
		const { result } = renderHook(() => useAuthStore());

		expect(result.current.isAuthenticated).toBe(false);
	});

	it("должен устанавливать пользователя при логине", () => {
		const { result } = renderHook(() => useAuthStore());

		const mockUser = {
			id: 1,
			email: "test@test.ru",
			role: "enterprise",
			name: "Тест",
		};

		act(() => {
			result.current.login(mockUser, "token123");
		});

		expect(result.current.isAuthenticated).toBe(true);
		expect(result.current.user).toEqual(mockUser);
	});

	it("должен очищать данные при логауте", () => {
		const { result } = renderHook(() => useAuthStore());

		act(() => {
			result.current.login({ id: 1 }, "token");
		});

		expect(result.current.isAuthenticated).toBe(true);

		act(() => {
			result.current.logout();
		});

		expect(result.current.isAuthenticated).toBe(false);
		expect(result.current.user).toBe(null);
	});
});

// Импорт в конце для hoisting
import { useAuthStore } from "../store/authStore";
