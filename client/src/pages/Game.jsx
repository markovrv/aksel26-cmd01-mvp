// ============================================
// Game Page - игровой экран
// ============================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { gamesApi } from "../api/client";
import { useSessionStore } from "../store/sessionStore";
import { useToastStore } from "../components/Toast";
import { QuizGame } from "../games/QuizGame";
import { AssemblyGame } from "../games/AssemblyGame";
import { QualityGame } from "../games/QualityGame";
import { FinalGame } from "../games/FinalGame";
import { CatcherGame } from "../games/CatcherGame";

export function Game() {
	const { sessionId, pointId } = useParams();
	const navigate = useNavigate();

	const [gameData, setGameData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const { markVisited } = useSessionStore();
	const showToast = useToastStore((state) => state.show);

	// Загрузка данных игры
	useEffect(() => {
		async function loadGame() {
			setIsLoading(true);

			try {
				const response = await gamesApi.getByPointId(pointId);
				setGameData(response.data);
			} catch (err) {
				console.error("[Game] Ошибка загрузки:", err);
				setError("Не удалось загрузить игру");
			} finally {
				setIsLoading(false);
			}
		}

		loadGame();
	}, [pointId]);

	// Завершение игры
	const handleGameComplete = async (score, maxScore) => {
		try {
			await markVisited(parseInt(pointId), score);
			showToast(`+${score} очков`, "success");
			navigate(`/tour/${sessionId}`);
		} catch (err) {
			console.error("[Game] Ошибка сохранения:", err);
			showToast("Ошибка сохранения результата", "error");
			navigate(`/tour/${sessionId}`);
		}
	};

	// Вернуться к экскурсии
	const handleBack = () => {
		navigate(`/tour/${sessionId}`);
	};

	// Загрузка
	if (isLoading) {
		return (
			<div className="min-h-screen bg-ar-bg flex items-center justify-center">
				<div className="text-center">
					<Loader2
						className="animate-spin text-primary mx-auto mb-4"
						size={48}
					/>
					<p className="font-inter text-text-muted">Загрузка игры...</p>
				</div>
			</div>
		);
	}

	// Ошибка или нет игры
	if (error || !gameData?.gameType) {
		return (
			<div className="min-h-screen bg-ar-bg flex items-center justify-center p-4">
				<div className="text-center max-w-sm">
					<h2 className="font-montserrat font-semibold text-xl text-white mb-4">
						{error || "На этой точке нет игры"}
					</h2>
					<button onClick={handleBack} className="btn-primary">
						Вернуться
					</button>
				</div>
			</div>
		);
	}

	// Рендер соответствующей игры
	return (
		<div className="min-h-screen bg-ar-bg">
			{/* Header */}
			<header className="h-14 bg-white/10 flex items-center px-4">
				<button
					onClick={handleBack}
					className="flex items-center gap-2 text-white"
				>
					<ArrowLeft size={20} />
					<span className="font-inter">Назад</span>
				</button>
			</header>

			{/* Game content */}
			<div className="h-[calc(100vh-56px)] bg-white">
				{gameData.gameType === "quiz" && (
					<QuizGame
						pointId={parseInt(pointId)}
						sessionId={parseInt(sessionId)}
						gameData={gameData.gameData}
						onComplete={handleGameComplete}
						onBack={handleBack}
					/>
				)}

				{gameData.gameType === "assembly" && (
					<AssemblyGame
						pointId={parseInt(pointId)}
						sessionId={parseInt(sessionId)}
						gameData={gameData.gameData}
						onComplete={handleGameComplete}
						onBack={handleBack}
					/>
				)}

				{gameData.gameType === "quality" && (
					<QualityGame
						pointId={parseInt(pointId)}
						sessionId={parseInt(sessionId)}
						gameData={gameData.gameData}
						onComplete={handleGameComplete}
						onBack={handleBack}
					/>
				)}

				{gameData.gameType === "final" && (
					<FinalGame
						pointId={parseInt(pointId)}
						sessionId={parseInt(sessionId)}
						gameData={gameData.gameData}
						onComplete={handleGameComplete}
						onBack={handleBack}
					/>
				)}

				{gameData.gameType === "catcher" && (
					<CatcherGame
						pointId={parseInt(pointId)}
						sessionId={parseInt(sessionId)}
						gameData={gameData.gameData}
						onComplete={handleGameComplete}
						onBack={handleBack}
					/>
				)}
			</div>
		</div>
	);
}

export default Game;
