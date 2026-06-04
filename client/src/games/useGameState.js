// ============================================
// useGameState Hook - общее состояние для игр
// ============================================

import { useState, useCallback, useRef, useEffect } from "react";

export const GAME_STATES = {
	IDLE: "idle",
	INTRO: "intro",
	PLAYING: "playing",
	ANSWERED: "answered",
	SUCCESS: "success",
	TIMEOUT: "timeout",
	RESULT: "result",
};

export function useGameState({ timeLimit, onComplete, maxScore = 100 }) {
	const [gameState, setGameState] = useState(GAME_STATES.IDLE);
	const [score, setScore] = useState(0);
	const [timeLeft, setTimeLeft] = useState(timeLimit || 60);
	const [isPaused, setIsPaused] = useState(false);

	const timerRef = useRef(null);

	// Таймер
	useEffect(() => {
		if (gameState === GAME_STATES.PLAYING && timeLeft > 0 && !isPaused) {
			timerRef.current = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						handleTimeout();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [gameState, isPaused]);

	// Начать игру
	const startGame = useCallback(() => {
		setGameState(GAME_STATES.PLAYING);
		setScore(0);
		setTimeLeft(timeLimit || 60);
	}, [timeLimit]);

	// Добавить очки
	const addScore = useCallback((points) => {
		setScore((prev) => prev + points);
	}, []);

	// Поставить на паузу
	const pauseGame = useCallback(() => {
		setIsPaused(true);
	}, []);

	// Снять с паузы
	const resumeGame = useCallback(() => {
		setIsPaused(false);
	}, []);

	// Завершить игру успешно
	const completeGame = useCallback(() => {
		clearInterval(timerRef.current);
		setGameState(GAME_STATES.SUCCESS);
		onComplete?.(score, maxScore);
	}, [score, maxScore, onComplete]);

	// Таймаут
	const handleTimeout = useCallback(() => {
		clearInterval(timerRef.current);
		setGameState(GAME_STATES.TIMEOUT);
		onComplete?.(0, maxScore);
	}, [maxScore, onComplete]);

	// Показать результат
	const showResult = useCallback(() => {
		setGameState(GAME_STATES.RESULT);
	}, []);

	// Сбросить игру
	const resetGame = useCallback(() => {
		clearInterval(timerRef.current);
		setGameState(GAME_STATES.IDLE);
		setScore(0);
		setTimeLeft(timeLimit || 60);
		setIsPaused(false);
	}, [timeLimit]);

	// Форматирование времени
	const formatTime = useCallback((seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}, []);

	return {
		gameState,
		score,
		timeLeft,
		isPaused,
		startGame,
		addScore,
		pauseGame,
		resumeGame,
		completeGame,
		handleTimeout,
		showResult,
		resetGame,
		formatTime,
	};
}

export default useGameState;
