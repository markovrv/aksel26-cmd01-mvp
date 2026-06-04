// ============================================
// QualityGame — игра для ОТК-стенда
// Проверка качества: брак или годная деталь по картинкам из /detals/
// ============================================

import { useState } from "react";
import { useGameState, GAME_STATES } from "./useGameState";
import { gamesApi } from "../api/client";

// Данные о деталях: путь к изображению и правильный ответ
const DETAILS = [
	{ img: "/detals/1good.png", label: "Деталь №1", isDefective: false },
	{ img: "/detals/2bed.png", label: "Деталь №2", isDefective: true },
	{ img: "/detals/3bed.png", label: "Деталь №3", isDefective: true },
	{ img: "/detals/4good.png", label: "Деталь №4", isDefective: false },
	{ img: "/detals/5bed.png", label: "Деталь №5", isDefective: true },
];

export function QualityGame({ pointId, sessionId, gameData, onComplete, onBack }) {
	const { gameState, score, timeLeft, startGame, addScore, completeGame, formatTime } =
		useGameState({ timeLimit: 45 });

	const [round, setRound] = useState(0);
	const [feedback, setFeedback] = useState(null); // {correct: bool, detail: "Брак"/"Годна"}
	const [roundsPlayed, setRoundsPlayed] = useState(0);

	const currentDetail = DETAILS[round];
	const totalRounds = DETAILS.length;

	const handleStart = () => {
		setRound(0);
		setFeedback(null);
		setRoundsPlayed(0);
		startGame();
	};

	const handleVerdict = (userSaysDefective) => {
		if (feedback) return; // уже ответили на этот раунд

		const isCorrect = userSaysDefective === currentDetail.isDefective;
		if (isCorrect) addScore(20);

		const correctAnswer = currentDetail.isDefective ? "Брак" : "Годна";
		setFeedback({
			correct: isCorrect,
			detail: correctAnswer,
		});
	};

	const handleNextRound = () => {
		setFeedback(null);
		const nextRound = round + 1;
		if (nextRound >= totalRounds) {
			// Все раунды пройдены
			completeGame();
		} else {
			setRound(nextRound);
		}
	};

	const handleFinish = async () => {
		try {
			await gamesApi.saveResult(pointId, { sessionId, score, maxScore: 100, timeSec: 45 - timeLeft });
		} catch (e) { /* ignore */ }
		onComplete(score, 100);
	};

	// IDLE
	if (gameState === GAME_STATES.IDLE) {
		return (
			<div className="flex items-center justify-center h-full" style={{ backgroundColor: "#0D1B2A" }}>
				<div className="text-center p-6 max-w-sm">
					<h2 className="font-montserrat text-2xl font-bold text-white mb-4">🔍 Контроль качества</h2>
					<p className="font-inter text-white/80 mb-6">Проверьте 5 деталей и определите, есть ли брак</p>
					<p className="font-inter text-sm text-white/70 mb-2">Деталей: {totalRounds} | Время: {formatTime(45)}</p>
					<p className="font-inter text-xs text-white/50 mb-8">За каждую верно определённую деталь: +20 очков</p>
					<button onClick={handleStart} className="btn-primary">Начать проверку</button>
					<button onClick={onBack} className="block w-full mt-4 text-white/70 hover:text-primary">Вернуться</button>
				</div>
			</div>
		);
	}

	// SUCCESS / TIMEOUT
	if (gameState === GAME_STATES.SUCCESS || gameState === GAME_STATES.TIMEOUT) {
		return (
			<div className="flex items-center justify-center h-full" style={{ backgroundColor: "#0D1B2A" }}>
				<div className="text-center p-6">
					<h2 className="font-montserrat text-2xl font-bold mb-4" style={{ color: gameState === GAME_STATES.SUCCESS ? "#2ECC71" : "#E74C3C" }}>
						{gameState === GAME_STATES.SUCCESS ? "✅ Проверка завершена" : "⏰ Время вышло"}
					</h2>
					<p className="font-inter text-white/80 mb-4">
						{gameState === GAME_STATES.SUCCESS ? "Все детали проверены!" : "Не все детали успели проверить"}
					</p>
					<div className="font-montserrat text-5xl font-bold mb-8" style={{ color: "#00C2D4" }}>
						+{score}<span className="text-lg text-white/70"> очков</span>
					</div>
					<button onClick={handleFinish} className="btn-primary">Продолжить</button>
				</div>
			</div>
		);
	}

	// PLAYING
	return (
		<div className="flex flex-col h-full relative" style={{ backgroundColor: "#0D1B2A" }}>
			{/* Timer */}
			<div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-xl z-10">
				<span className="font-mono text-2xl">{formatTime(timeLeft)}</span>
			</div>

			{/* Progress */}
			<div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-xl z-10">
				<span className="font-inter">
					<span style={{ color: "#00C2D4" }} className="font-semibold">{round + 1}</span>
					<span className="text-white/60">/{totalRounds}</span>
				</span>
			</div>

			{/* Detail image */}
			<div className="flex-1 flex flex-col items-center justify-center p-6">
				<div className="text-center">
					<p className="font-inter text-white/80 text-sm mb-4">{currentDetail.label}</p>
					<div className="mb-6 inline-block rounded-2xl overflow-hidden border-2 border-white/20" style={{ maxWidth: 300 }}>
						<img
							src={currentDetail.img}
							alt={currentDetail.label}
							style={{ width: "100%", height: "auto", display: "block" }}
							onError={(e) => { e.target.style.display = "none"; }}
						/>
					</div>

					{/* Feedback or buttons */}
					{feedback ? (
						<div className="text-center">
							<p className="font-inter text-lg mb-3" style={{ color: feedback.correct ? "#2ECC71" : "#E74C3C" }}>
								{feedback.correct ? "✅ Верно!" : "❌ Ошибка"}
							</p>
							<p className="font-inter text-white/70 mb-6">
								Правильный ответ: <strong>{feedback.detail}</strong>
							</p>
							<button
								onClick={handleNextRound}
								className="bg-[#00C2D4] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#00A3B8]"
							>
								{round + 1 >= totalRounds ? "Завершить" : "Следующая деталь →"}
							</button>
						</div>
					) : (
						<div className="flex gap-4 justify-center">
							<button
								onClick={() => handleVerdict(true)}
								className="bg-[#E74C3C] text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-[#c0392b] transition-colors"
							>
								❌ Брак
							</button>
							<button
								onClick={() => handleVerdict(false)}
								className="bg-[#2ECC71] text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-[#27ae60] transition-colors"
							>
								✅ Годна
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Score display */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-xl text-sm">
				<span className="font-inter">Очки: <span style={{ color: "#00C2D4" }}>{score}</span></span>
			</div>
		</div>
	);
}

export default QualityGame;