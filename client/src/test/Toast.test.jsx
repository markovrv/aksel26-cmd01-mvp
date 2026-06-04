// ============================================
// Тесты для Toast компонента
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toast } from "../components/Toast";
import { useToastStore } from "../store/toastStore";

// Мок сторы toast
vi.mock("../store/toastStore", () => ({
	useToastStore: vi.fn(),
}));

describe("Toast Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("должен рендерить toast когда есть сообщение", () => {
		useToastStore.mockReturnValue({
			message: "Тестовое сообщение",
			type: "success",
			hideToast: vi.fn(),
		});

		render(<Toast />);

		expect(screen.getByText("Тестовое сообщение")).toBeInTheDocument();
	});

	it("должен скрывать toast по клику", async () => {
		const hideToast = vi.fn();
		useToastStore.mockReturnValue({
			message: "Сообщение",
			type: "success",
			hideToast,
		});

		render(<Toast />);

		const closeButton = screen.getByRole("button");
		await act(async () => {
			fireEvent.click(closeButton);
		});

		expect(hideToast).toHaveBeenCalled();
	});
});
