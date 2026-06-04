// ============================================
// useARDetection Hook - отслеживание обнаружения маркеров
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useToastStore } from "../components/Toast";

export function useARDetection({
	onMarkerDetected,
	onHintNeeded,
	hintDelay = 5000, // 5 секунд
}) {
	const [activeMarkerId, setActiveMarkerId] = useState(null);
	const [isDetecting, setIsDetecting] = useState(false);
	const showToast = useToastStore((state) => state.show);

	const timeoutRef = useRef(null);
	const hintTimerRef = useRef(null);

	// Очистка таймеров
	const clearTimers = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		if (hintTimerRef.current) {
			clearTimeout(hintTimerRef.current);
			hintTimerRef.current = null;
		}
	}, []);

	// Показать подсказку
	const showHint = useCallback(() => {
		showToast("Наведите камеру ровнее", "info");
		onHintNeeded?.();
	}, [showToast, onHintNeeded]);

	// Запуск таймера ожидания маркера
	const startHintTimer = useCallback(() => {
		clearTimers();
		setIsDetecting(true);

		hintTimerRef.current = setTimeout(() => {
			if (!activeMarkerId) {
				showHint();
			}
		}, hintDelay);
	}, [clearTimers, activeMarkerId, showHint, hintDelay]);

	// Обработка обнаружения маркера
	const handleMarkerFound = useCallback(
		(markerId) => {
			clearTimers();
			setActiveMarkerId(markerId);
			setIsDetecting(false);
			onMarkerDetected?.(markerId);
		},
		[clearTimers, onMarkerDetected],
	);

	// Обработка потери маркера
	const handleMarkerLost = useCallback(
		(markerId) => {
			if (activeMarkerId === markerId) {
				setActiveMarkerId(null);
				startHintTimer();
			}
		},
		[activeMarkerId, startHintTimer],
	);

	// Сброс состояния
	const reset = useCallback(() => {
		clearTimers();
		setActiveMarkerId(null);
		setIsDetecting(false);
	}, [clearTimers]);

	// Запуск при mount
	useEffect(() => {
		startHintTimer();

		return () => {
			clearTimers();
		};
	}, []);

	// Перезапуск таймера при потере активного маркера
	useEffect(() => {
		if (!activeMarkerId && isDetecting === false) {
			startHintTimer();
		}
	}, [activeMarkerId, isDetecting, startHintTimer]);

	return {
		activeMarkerId,
		isDetecting,
		handleMarkerFound,
		handleMarkerLost,
		showHint,
		reset,
	};
}

export default useARDetection;
