// ============================================
// Toast Component - уведомления
// ============================================

import { useState, useEffect, useCallback } from "react";
import { create } from "zustand";

export const useToastStore = create((set) => ({
	message: "",
	type: "info", // info, success, error
	visible: false,

	show: (message, type = "info", duration = 3000) => {
		set({ message, type, visible: true });
		setTimeout(() => {
			set({ visible: false });
		}, duration);
	},

	hide: () => set({ visible: false }),
}));

export function Toast() {
	const { message, type, visible } = useToastStore();
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (visible) {
			setIsAnimating(true);
		}
	}, [visible]);

	if (!visible && !isAnimating) return null;

	const bgColors = {
		info: "bg-black/80",
		success: "bg-success",
		error: "bg-error",
	};

	return (
		<div
			className={`
                fixed top-4 left-1/2 -translate-x-1/2 z-[100]
                ${bgColors[type]} text-white
                px-6 py-3 rounded-xl
                shadow-lg max-w-[90vw]
                transition-all duration-300
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
            `}
		>
			<p className="font-inter text-sm text-center whitespace-nowrap">
				{message}
			</p>
		</div>
	);
}

export default Toast;
