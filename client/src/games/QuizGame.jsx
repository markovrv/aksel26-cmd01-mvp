// ============================================
// QuizGame Component - игра Викторина
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useGameState, GAME_STATES } from "./useGameState";
import { gamesApi } from "../api/client";

export function QuizGame({ pointId, sessionId, gameData, onComplete, onBack }) {
	const {
		gameState,
		score,
		timeLeft,
		startGame,
		addScore,
		showResult,
		formatTime,
	} = useGameState({
		timeLimit:
			(gameData?.timePerQuestion || 20) * (gameData?.questions?.length || 3),
	});

	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState(null);
	const [isCorrect, setIsCorrect] = useState(null);
	const [correctCount, setCorrectCount] = useState(0);
	const [localScore, setLocalScore] = useState(0);

	const questions = gameData?.questions || [];
	const currentQuestion = questions[currentIndex];
	const timePerQuestion = gameData?.timePerQuestion || 20;
	const pointsPerCorrect = gameData?.pointsPerCorrect || 30;

	// Таймер для вопроса
	const [questionTimeLeft, setQuestionTimeLeft] = useState(timePerQuestion);

	useEffect(() => {
		if (gameState !== GAME_STATES.PLAYING) return;

		const timer = setInterval(() => {
			setQuestionTimeLeft((prev) => {
				if (prev <= 1) {
					handleAnswer(-1); // Неправильный ответ по таймауту
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [gameState, currentIndex]);

	// Начать викторину
	const handleStart = () => {
		setCurrentIndex(0);
		setCorrectCount(0);
		setLocalScore(0);
		setQuestionTimeLeft(timePerQuestion);
		startGame();
	};

	// Ответить на вопрос
	const handleAnswer = useCallback(
		(answerIndex) => {
			if (selectedAnswer !== null) return; // Уже ответили

			setSelectedAnswer(answerIndex);

			const correct = answerIndex === currentQuestion.correct;
			setIsCorrect(correct);

			if (correct) {
				addScore(pointsPerCorrect);
				setCorrectCount((prev) => prev + 1);
			}

			// Переход к следующему вопросу через 1.5 сек
			setTimeout(() => {
				if (currentIndex < questions.length - 1) {
					setCurrentIndex((prev) => prev + 1);
					setSelectedAnswer(null);
					setIsCorrect(null);
					setQuestionTimeLeft(timePerQuestion);
				} else {
					showResult();
				}
			}, 1500);
		},
		[
			selectedAnswer,
			currentIndex,
			currentQuestion,
			questions.length,
			addScore,
			pointsPerCorrect,
			timePerQuestion,
			showResult,
		],
	);

	// Завершение
	const handleComplete = async () => {
		const finalScore = correctCount * pointsPerCorrect;
		const maxScore = questions.length * pointsPerCorrect;

		try {
			await gamesApi.saveResult(pointId, {
				sessionId,
				score: finalScore,
				maxScore,
				timeSec: 0,
			});
		} catch (error) {
			console.error("[QuizGame] Ошибка сохранения:", error);
		}

		onComplete?.(finalScore, maxScore);
	};

	// Рендер по состоянию
	if (gameState === GAME_STATES.IDLE || gameState === GAME_STATES.INTRO) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6">
				<div className="text-center">
					<h2 className="font-montserrat text-2xl font-bold text-text-main mb-4">
						Проверь себя!
					</h2>
					<p className="font-inter text-text-muted mb-6">
						Ответь на {questions.length} вопросов по увиденному объекту
					</p>
					<p className="font-inter text-sm text-text-muted mb-8">
						За каждый правильный ответ: {pointsPerCorrect} очков
					</p>
					<button onClick={handleStart} className="btn-primary">
						Начать
					</button>
					<button
						onClick={onBack}
						className="block w-full mt-4 text-text-muted hover:text-primary"
					>
						Вернуться к экскурсии
					</button>
				</div>
			</div>
		);
	}

	if (gameState === GAME_STATES.RESULT) {
		const maxScore = questions.length * pointsPerCorrect;

		return (
			<div className="flex flex-col items-center justify-center h-full p-6">
				<div className="text-center">
					<h2 className="font-montserrat text-2xl font-bold text-text-main mb-4">
						Результат
					</h2>
					<p className="font-inter text-text-muted mb-4">
						Вы ответили верно на {correctCount} из {questions.length}
					</p>
					<div className="font-montserrat text-5xl font-bold text-primary mb-8">
						{score}
						<span className="text-lg text-text-muted"> / {maxScore}</span>
					</div>
					<button onClick={handleComplete} className="btn-primary">
						Продолжить
					</button>
				</div>
			</div>
		);
	}

	// Игровой экран
	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-surface-2">
				<div className="flex justify-between items-center mb-2">
					<span className="font-inter text-sm text-text-muted">
						Вопрос {currentIndex + 1} из {questions.length}
					</span>
					<span className="font-montserrat font-semibold text-primary">
						{score} очков
					</span>
				</div>

				{/* Таймер */}
				<div className="h-1 bg-surface-2 rounded-full overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-1000"
						style={{ width: `${(questionTimeLeft / timePerQuestion) * 100}%` }}
					/>
				</div>
				<div className="text-right mt-1">
					<span className="font-mono text-sm text-text-muted">
						{formatTime(questionTimeLeft)}
					</span>
				</div>
			</div>

			{/* Question */}
			<div className="flex-1 p-6 flex flex-col">
				<h3 className="font-montserrat font-semibold text-xl text-text-main mb-6">
					{currentQuestion?.text}
				</h3>

				{/* Options */}
				<div className="grid grid-cols-1 gap-3 flex-1">
					{currentQuestion?.options?.map((option, index) => {
						let buttonClass =
							"border-2 border-surface-2 rounded-xl p-4 text-left font-inter transition-all active:scale-95";

						if (selectedAnswer !== null) {
							if (index === currentQuestion.correct) {
								buttonClass += " border-success bg-success/10";
							} else if (index === selectedAnswer && !isCorrect) {
								buttonClass += " border-error bg-error/10";
							}
						} else {
							buttonClass += " hover:border-primary cursor-pointer";
						}

						return (
							<button
								key={index}
								onClick={() => handleAnswer(index)}
								disabled={selectedAnswer !== null}
								className={buttonClass}
							>
								<span className="font-semibold mr-2">
									{String.fromCharCode(65 + index)}.
								</span>
								{option}
							</button>
						);
					})}
				</div>

				{/* Explanation */}
				{selectedAnswer !== null && (
					<div className="mt-4 p-4 bg-surface-2 rounded-xl">
						<p className="font-inter text-sm italic text-text-muted">
							{currentQuestion?.explanation}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default QuizGame;
