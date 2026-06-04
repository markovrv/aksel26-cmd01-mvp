// ============================================
// Tour Page - AR-тур с 3D превью
// ============================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Info, Gamepad2, Camera } from "lucide-react";
import { routesApi, sessionsApi } from "../api/client";
import { useSessionStore } from "../store/sessionStore";
import { BottomSheet } from "../components/BottomSheet";
import { ProgressBadge } from "../components/ProgressBar";
import { ARInstructions } from "../components/ARInstructions";
import { AR3DPreview } from "../components/AR3DPreview";

// Маппинг названия точки → тип 3D-модели (Three.js procedural)
// Каждая точка маршрута получает уникальный тип для визуального разнообразия
function getModelType(point) {
	if (!point) return "cube";
	const title = (point.title || "").toLowerCase();
	const modelUrl = point.model_url || "";

	// Сначала пробуем по model_url
	if (modelUrl.includes("furnace")) return "furnace";
	if (modelUrl.includes("rolling") || modelUrl.includes("mill")) return "gear";

	// По названию точки — распределяем разные типы
	if (title.includes("домен") || title.includes("печь")) return "furnace";
	if (title.includes("прокат") || title.includes("стан")) return "gear";
	if (title.includes("отк") || title.includes("контрол")) return "soldier";
	if (title.includes("финал") || title.includes("стенд")) return "horse";
	if (title.includes("робот")) return "robot";
	if (title.includes("лошад") || title.includes("конь")) return "horse";

	// Уникальное распределение по id точки
	const pointId = point.id || 0;
	const types = ["furnace", "gear", "soldier", "horse", "robot", "cube"];
	return types[pointId % types.length];
}

export function Tour() {
	const { sessionId } = useParams();
	const navigate = useNavigate();

	const [routeData, setRouteData] = useState(null);
	const [activePoint, setActivePoint] = useState(null);
	const [showDetails, setShowDetails] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showARHelp, setShowARHelp] = useState(false);
	const [showExitConfirm, setShowExitConfirm] = useState(false);

	const { visitedPointIds, loadProgress, markVisited } = useSessionStore();

	// Загрузка данных
	useEffect(() => {
		async function loadData() {
			setIsLoading(true);
			try {
				const sessionResponse = await sessionsApi.getById(sessionId);
				const { route_id } = sessionResponse.data;

				const routeResponse = await routesApi.getById(route_id);
				setRouteData(routeResponse.data);

				// Авто-выбор первой точки маршрута
				if (routeResponse.data?.points?.length > 0) {
					setActivePoint(routeResponse.data.points[0]);
				}

				await loadProgress();
			} catch (err) {
				console.error("[Tour] Error:", err);
				setError("Не удалось загрузить маршрут");
			} finally {
				setIsLoading(false);
			}
		}
		loadData();
	}, [sessionId]);

	// Выбор активной точки
	const handlePointSelect = (point) => {
		setActivePoint(point);
	};

	// Посещение точки
	const handleVisit = async () => {
		if (!activePoint || visitedPointIds.includes(activePoint.id)) return;
		try {
			await sessionsApi.visit(sessionId, {
				pointId: activePoint.id,
				gameScore: 0,
			});
			markVisited(activePoint.id);
		} catch (err) {
			console.error("[Tour] Visit error:", err);
		}
	};

	// Переход к игре
	const handlePlayGame = () => {
		if (activePoint?.game_type) {
			navigate(`/game/${sessionId}/${activePoint.id}`);
		}
	};

	// Завершение экскурсии
	const handleComplete = async () => {
		try {
			await sessionsApi.complete(sessionId);
			navigate(`/complete/${sessionId}`);
		} catch (err) {
			console.error("[Tour] Complete error:", err);
		}
	};

	// Выход
	const handleExit = () => {
		navigate("/");
	};

	if (isLoading) {
		return (
			<div className="fixed inset-0 bg-ar-bg flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin text-4xl mb-4">⟳</div>
					<p className="text-text-muted font-inter">Загрузка...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="fixed inset-0 bg-ar-bg flex items-center justify-center">
				<div className="text-center p-8">
					<p className="text-red-400 font-inter mb-4">{error}</p>
					<button onClick={() => navigate("/")} className="btn-primary">
						На главную
					</button>
				</div>
			</div>
		);
	}

	const points = routeData?.points || [];
	const visitedCount = visitedPointIds.length;
	const allVisited = visitedCount >= points.length;

	return (
		<div className="fixed inset-0 bg-black flex flex-col">
			{/* Header */}
			<div className="bg-ar-bg/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/10 z-10">
				<div className="flex items-center gap-3">
					<button onClick={() => setShowExitConfirm(true)} className="p-2">
						<X className="text-white" size={24} />
					</button>
					<div>
						<h1 className="font-montserrat font-semibold text-white text-lg">
							{routeData?.title || "Маршрут"}
						</h1>
						<ProgressBadge current={visitedCount} total={points.length} />
					</div>
				</div>
				<button
					onClick={() => setShowARHelp(true)}
					className="p-2 bg-white/10 rounded-xl hover:bg-white/20"
					title="Как увидеть AR"
				>
					<Camera className="text-primary" size={20} />
				</button>
			</div>

			{/* Body: side panel + 3D area */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left panel — список точек */}
				<div className="w-[300px] bg-ar-bg/95 border-r border-white/10 flex flex-col overflow-hidden flex-shrink-0">
					<div className="flex-1 overflow-y-auto p-3 space-y-2">
						{points.map((point) => (
							<button
								key={point.id}
								onClick={() => handlePointSelect(point)}
								className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left ${
									activePoint?.id === point.id
										? "bg-primary text-white"
										: visitedPointIds.includes(point.id)
											? "bg-green-500/20 border border-green-500/50"
											: "bg-white/10 border border-white/20 hover:bg-white/20"
								}`}
							>
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
										visitedPointIds.includes(point.id)
											? "bg-green-500 text-white"
											: "bg-white/20 text-white"
									}`}
								>
									{visitedPointIds.includes(point.id) ? "✓" : point.id}
								</div>
								<div className="flex-1 min-w-0">
									<p
										className={`font-semibold text-sm truncate ${activePoint?.id === point.id ? "text-white" : "text-white/90"}`}
									>
										{point.title}
									</p>
									<p className="text-xs opacity-70 truncate">
										{visitedPointIds.includes(point.id)
											? "Посещено"
											: point.description?.substring(0, 25) + "..."}
									</p>
								</div>
								{point.game_type && <Gamepad2 size={16} className="opacity-70 flex-shrink-0" />}
							</button>
						))}
					</div>

					{/* Action buttons — всегда видны внизу панели */}
					<div className="p-3 border-t border-white/10 space-y-2 bg-ar-bg/95">
						{activePoint && (
							<div className="flex flex-col gap-2">
								<button
									onClick={() => setShowDetails(true)}
									className="w-full py-2.5 bg-white/20 rounded-xl flex items-center justify-center gap-2 text-white font-inter text-sm"
								>
									<Info size={16} />
									Подробнее
								</button>
								{activePoint.game_type && (
									<button
										onClick={handlePlayGame}
										className="w-full py-2.5 bg-primary rounded-xl flex items-center justify-center gap-2 text-white font-inter text-sm"
									>
										<Gamepad2 size={16} />
										Играть
									</button>
								)}
								{!visitedPointIds.includes(activePoint.id) && (
									<button
										onClick={handleVisit}
										className="w-full py-2.5 bg-green-500 rounded-xl text-white font-inter text-sm"
									>
										Отметить
									</button>
								)}
							</div>
						)}

						{allVisited && (
							<button
								onClick={handleComplete}
								className="w-full btn-primary py-3 text-sm"
							>
								Завершить экскурсию
							</button>
						)}
					</div>
				</div>

				{/* Right area — 3D Preview */}
				<div className="flex-1 relative">
					<AR3DPreview
						modelType={getModelType(activePoint)}
						color={
							activePoint && visitedPointIds.includes(activePoint.id)
								? "#2ECC71"
								: "#00C2D4"
						}
						size={2}
						autoRotate={true}
						showInfo={true}
						pointName={activePoint?.title || "Выберите точку слева"}
					/>
				</div>
			</div>

			{/* Bottom Sheet - Details */}
			<BottomSheet
				isOpen={showDetails}
				onClose={() => setShowDetails(false)}
				title={activePoint?.title}
				height="50%"
			>
				{activePoint && (
					<div className="space-y-4">
						<p className="font-inter text-text-main">
							{activePoint.description}
						</p>
						{activePoint.game_type && (
							<div className="p-4 bg-primary/10 rounded-xl">
								<p className="text-primary font-semibold mb-2">
									🎮 Мини-игра доступна!
								</p>
								<p className="text-text-muted text-sm">
									Пройдите игру для получения дополнительных очков.
								</p>
							</div>
						)}
					</div>
				)}
			</BottomSheet>

			{/* Exit Confirmation */}
			{showExitConfirm && (
				<>
					<div
						className="fixed inset-0 bg-black/50 z-30"
						onClick={() => setShowExitConfirm(false)}
					/>
					<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-40 max-w-sm w-[90%]">
						<h3 className="font-montserrat font-semibold text-xl text-text-main mb-2">
							Выйти из экскурсии?
						</h3>
						<p className="font-inter text-text-muted mb-6">
							Ваш прогресс сохранён
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowExitConfirm(false)}
								className="btn-secondary flex-1"
							>
								Продолжить
							</button>
							<button onClick={handleExit} className="btn-primary flex-1">
								Выйти
							</button>
						</div>
					</div>
				</>
			)}

			{/* AR Instructions */}
			<ARInstructions
				isOpen={showARHelp}
				onClose={() => setShowARHelp(false)}
				pointName={activePoint?.title || "модель"}
			/>
		</div>
	);
}

export default Tour;
