// ============================================
// Toast Store - управление уведомлениями
// ============================================

import { create } from "zustand";

export const useToastStore = create((set) => ({
	message: "",
	type: "success", // success, error, info
	showToast: (message, type = "success") => {
		set({ message, type });
		// Автоматически скрываем через 3 секунды
		setTimeout(() => {
			set({ message: "" });
		}, 3000);
	},
	hideToast: () => set({ message: "" }),
}));
