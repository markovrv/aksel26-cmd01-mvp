// ============================================
// BottomSheet Component - выдвижная панель снизу
// ============================================

import { useState, useEffect, useRef } from "react";

export function BottomSheet({
	isOpen,
	onClose,
	title,
	children,
	height = "60%",
}) {
	const sheetRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);
	const [startY, setStartY] = useState(0);

	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === "Escape") onClose();
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "";
		};
	}, [isOpen, onClose]);

	const handleTouchStart = (e) => {
		setIsDragging(true);
		setStartY(e.touches[0].clientY);
	};

	const handleTouchMove = (e) => {
		if (!isDragging) return;
		const currentY = e.touches[0].clientY;
		const diff = currentY - startY;

		if (diff > 0 && sheetRef.current) {
			sheetRef.current.style.transform = `translateY(${diff}px)`;
		}
	};

	const handleTouchEnd = (e) => {
		if (!isDragging) return;
		setIsDragging(false);

		const diff = e.changedTouches[0].clientY - startY;

		if (diff > 100) {
			onClose();
		} else if (sheetRef.current) {
			sheetRef.current.style.transform = "";
		}
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className={`
                    fixed inset-0 bg-black/50 z-40
                    transition-opacity duration-300
                    ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
				onClick={onClose}
			/>

			{/* Sheet */}
			<div
				ref={sheetRef}
				className={`
                    fixed bottom-0 left-0 right-0 z-50
                    bg-white rounded-t-[20px] shadow-ar
                    transition-transform duration-300 ease-out
                    ${isOpen ? "translate-y-0" : "translate-y-full"}
                `}
				style={{ height }}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Handle */}
				<div
					className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
					onClick={onClose}
				>
					<div className="w-10 h-1 bg-gray-300 rounded-full" />
				</div>

				{/* Header */}
				{title && (
					<div className="px-6 pb-3 border-b border-surface-2">
						<h3 className="font-montserrat font-semibold text-lg text-text-main">
							{title}
						</h3>
					</div>
				)}

				{/* Content */}
				<div
					className="p-6 overflow-y-auto"
					style={{ height: `calc(${height} - 60px)` }}
				>
					{children}
				</div>
			</div>
		</>
	);
}

export default BottomSheet;
