// ============================================
// AssemblyGame Component - игра Собери пазл 3x3 из pic.jpg
// Перетащите фрагменты изображения в правильные ячейки
// ============================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useGameState, GAME_STATES } from "./useGameState";
import { gamesApi } from "../api/client";
import { splitImageIntoPieces } from "../utils/imageSplitter";

const GRID_SIZE = 3;
const TILE_COUNT = GRID_SIZE * GRID_SIZE; // 9
const PIECE_SIZE = 60; // px, размер одного фрагмента
const GAP = 4; // px, отступ между ячейками

export function AssemblyGame({
	pointId,
	sessionId,
	gameData,
	onComplete,
	onBack,
}) {
	const {
		gameState,
		score,
		timeLeft,
		startGame,
		addScore,
		completeGame,
		handleTimeout,
		formatTime,
		resetGame,
	} = useGameState({
		timeLimit: gameData?.timeLimit || 120,
	});

	const [tiles, setTiles] = useState([]);        // [{id, correctIndex, img, currentPosition}]
	const [placedTiles, setPlacedTiles] = useState([]); // [tileId or null] по индексу ячейки
	const [draggedTileId, setDraggedTileId] = useState(null);
	const [pieceImages, setPieceImages] = useState([]); // dataURL фрагментов
	const [isLoadingImage, setIsLoadingImage] = useState(true);

	const boardRef = useRef(null);

	// Загрузка и нарезка изображения при первом рендере
	useEffect(() => {
		async function loadImage() {
			try {
				const pieces = await splitImageIntoPieces("/pic.jpg", GRID_SIZE, PIECE_SIZE);
				setPieceImages(pieces);
			} catch (err) {
				console.error("[AssemblyGame] Ошибка загрузки изображения:", err);
				// fallback — цветные плитки с цифрами
				const fallback = Array.from({ length: TILE_COUNT }, (_, i) => {
					const c = document.createElement("canvas");
					c.width = PIECE_SIZE;
					c.height = PIECE_SIZE;
					const ctx = c.getContext("2d");
					ctx.fillStyle = `hsl(${(i * 40) % 360}, 70%, 50%)`;
					ctx.fillRect(0, 0, PIECE_SIZE, PIECE_SIZE);
					ctx.fillStyle = "#fff";
					ctx.font = "bold 24px sans-serif";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText(String(i + 1), PIECE_SIZE / 2, PIECE_SIZE / 2);
					return c.toDataURL();
				});
				setPieceImages(fallback);
			} finally {
				setIsLoadingImage(false);
			}
		}
		loadImage();
	}, []);

	// Инициализация тайлов (случайное размещение фрагментов)
	const initializeTiles = useCallback(() => {
		const indices = Array.from({ length: TILE_COUNT }, (_, i) => i);
		// Перемешиваем
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[indices[i], indices[j]] = [indices[j], indices[i]];
		}
		return indices.map((correctIndex) => ({
			id: `piece-${correctIndex}`,
			correctIndex,
			currentPosition: {
				x: (Math.random() - 0.5) * 300,
				y: (Math.random() - 0.5) * 300,
			},
		}));
	}, []);

	// Начать игру
	const handleStart = () => {
		setTiles(initializeTiles());
		setPlacedTiles(new Array(TILE_COUNT).fill(null));
		setDraggedTileId(null);
		startGame();
	};

	// Drag handlers (mouse + touch)
	const getPosition = (e, container) => {
		const rect = container.getBoundingClientRect();
		let clientX, clientY;
		if (e.touches) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
		}
		return {
			x: clientX - rect.left - rect.width / 2,
			y: clientY - rect.top - rect.height / 2,
		};
	};

	const handleDragStart = (e, tileId) => {
		e.preventDefault();
		if (placedTiles.includes(tileId)) return;
		setDraggedTileId(tileId);
	};

	const handleDragEnd = useCallback(() => {
		if (!draggedTileId) return;

		const tile = tiles.find((t) => t.id === draggedTileId);
		if (!tile) {
			setDraggedTileId(null);
			return;
		}

		const boardEl = boardRef.current;
		if (!boardEl) {
			setDraggedTileId(null);
			return;
		}
		const boardRect = boardEl.getBoundingClientRect();
		const boardCenterX = boardRect.left + boardRect.width / 2;
		const boardCenterY = boardRect.top + boardRect.height / 2;

		const tileAbsX = boardCenterX + tile.currentPosition.x;
		const tileAbsY = boardCenterY + tile.currentPosition.y;

		const gridStartX = boardCenterX - ((GRID_SIZE * (PIECE_SIZE + GAP)) / 2) + (PIECE_SIZE + GAP) / 2;
		const gridStartY = boardCenterY - ((GRID_SIZE * (PIECE_SIZE + GAP)) / 2) + (PIECE_SIZE + GAP) / 2;

		let cellCol = -1, cellRow = -1;
		for (let row = 0; row < GRID_SIZE; row++) {
			for (let col = 0; col < GRID_SIZE; col++) {
				const cellX = gridStartX + col * (PIECE_SIZE + GAP);
				const cellY = gridStartY + row * (PIECE_SIZE + GAP);
				if (
					tileAbsX >= cellX - PIECE_SIZE / 2 &&
					tileAbsX <= cellX + PIECE_SIZE / 2 &&
					tileAbsY >= cellY - PIECE_SIZE / 2 &&
					tileAbsY <= cellY + PIECE_SIZE / 2
				) {
					cellCol = col;
					cellRow = row;
					break;
				}
			}
			if (cellCol >= 0) break;
		}

		if (cellCol >= 0) {
			const cellIndex = cellRow * GRID_SIZE + cellCol;
			// Правильная ячейка: correctIndex совпадает с cellIndex
			if (tile.correctIndex === cellIndex) {
				if (!placedTiles[cellIndex]) {
					const newPlaced = [...placedTiles];
					newPlaced[cellIndex] = draggedTileId;
					setPlacedTiles(newPlaced);

					// Фиксируем тайл в центр ячейки
					const cellCenterX = (cellCol - (GRID_SIZE - 1) / 2) * (PIECE_SIZE + GAP);
					const cellCenterY = (cellRow - (GRID_SIZE - 1) / 2) * (PIECE_SIZE + GAP);
					setTiles((prev) =>
						prev.map((t) =>
							t.id === draggedTileId
								? { ...t, currentPosition: { x: cellCenterX, y: cellCenterY } }
								: t,
						),
					);

					const allPlaced = newPlaced.every((id) => id !== null);
					if (allPlaced) {
						const timeBonus = Math.round(
							((timeLeft || 0) / (gameData?.timeLimit || 120)) * 100,
						);
						addScore(timeBonus + 100);
						setTimeout(() => completeGame(), 300);
					}
				}
			}
		}

		setDraggedTileId(null);
	}, [draggedTileId, tiles, placedTiles, timeLeft, gameData, addScore, completeGame]);

	// Глобальные обработчики мыши/touch
	useEffect(() => {
		if (!draggedTileId) return;
		const handlePointerMove = (e) => {
			const container = boardRef.current;
			if (!container) return;
			let clientX, clientY;
			if (e.touches) {
				clientX = e.touches[0].clientX;
				clientY = e.touches[0].clientY;
			} else {
				clientX = e.clientX;
				clientY = e.clientY;
			}
			const rect = container.getBoundingClientRect();
			const pos = {
				x: clientX - rect.left - rect.width / 2,
				y: clientY - rect.top - rect.height / 2,
			};
			setTiles((prev) =>
				prev.map((t) =>
					t.id === draggedTileId ? { ...t, currentPosition: { x: pos.x, y: pos.y } } : t,
				),
			);
		};
		const handlePointerUp = () => handleDragEnd();
		window.addEventListener("mousemove", handlePointerMove);
		window.addEventListener("mouseup", handlePointerUp);
		window.addEventListener("touchmove", handlePointerMove, { passive: true });
		window.addEventListener("touchend", handlePointerUp);
		return () => {
			window.removeEventListener("mousemove", handlePointerMove);
			window.removeEventListener("mouseup", handlePointerUp);
			window.removeEventListener("touchmove", handlePointerMove);
			window.removeEventListener("touchend", handlePointerUp);
		};
	}, [draggedTileId, handleDragEnd]);

	// Таймаут
	useEffect(() => {
		if (gameState === GAME_STATES.PLAYING && timeLeft === 0) {
			handleTimeout();
		}
	}, [timeLeft, gameState]);

	// Пропустить
	const handleSkip = async () => {
		resetGame();
		onComplete?.(0, 100);
	};

	// Завершить
	const handleComplete = async () => {
		const timeBonus = Math.round(
			((timeLeft || 0) / (gameData?.timeLimit || 120)) * 100,
		);
		const finalScore = timeBonus + 100;
		addScore(finalScore);
		try {
			await gamesApi.saveResult(pointId, {
				sessionId,
				score: finalScore,
				maxScore: 100,
				timeSec: (gameData?.timeLimit || 120) - timeLeft,
			});
		} catch (error) {
			console.error("[AssemblyGame] Save error:", error);
		}
		onComplete?.(finalScore, 100);
	};

	// IDLE
	if (gameState === GAME_STATES.IDLE) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6" style={{ backgroundColor: "#0D1B2A", color: "#fff" }}>
				<div className="text-center">
					<h2 className="font-montserrat text-2xl font-bold mb-4">
						Собери пазл 3×3
					</h2>
					<p className="font-inter text-white/80 mb-6">
						Перетащите фрагменты изображения на свои места
					</p>
					<p className="font-inter text-sm text-white/70 mb-8">
						Время: {formatTime(gameData?.timeLimit || 120)}
					</p>
					<button
						onClick={handleStart}
						disabled={isLoadingImage}
						className="btn-primary"
					>
						{isLoadingImage ? "Загрузка изображения..." : "Начать сборку"}
					</button>
					<button
						onClick={onBack}
						className="block w-full mt-4 text-white/70 hover:text-primary"
					>
						Вернуться к экскурсии
					</button>
				</div>
			</div>
		);
	}

	// Результат
	if (gameState === GAME_STATES.SUCCESS || gameState === GAME_STATES.TIMEOUT) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6" style={{ backgroundColor: "#0D1B2A", color: "#fff" }}>
				<div className="text-center">
					<h2 className="font-montserrat text-2xl font-bold mb-4" style={{ color: gameState === GAME_STATES.SUCCESS ? "#2ECC71" : "#E74C3C" }}>
						{gameState === GAME_STATES.SUCCESS ? "🎉 Пазл собран!" : "⏰ Время вышло!"}
					</h2>
					<p className="font-inter text-white/80 mb-4">
						{gameState === GAME_STATES.SUCCESS
							? "Все фрагменты на своих местах!"
							: "Попробуйте ещё раз"}
					</p>
					<div className="font-montserrat text-5xl font-bold mb-8" style={{ color: "#00C2D4" }}>
						+{score}
						<span className="text-lg text-white/70"> очков</span>
					</div>
					<button onClick={handleComplete} className="btn-primary">
						Продолжить
					</button>
				</div>
			</div>
		);
	}

	// Игровой экран
	const cellCount = placedTiles.filter((id) => id !== null).length;

	return (
		<div className="relative h-full flex flex-col" style={{ backgroundColor: "#0D1B2A" }}>
			{/* Header */}
			<div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-xl z-10">
				<span className="font-mono text-2xl">{formatTime(timeLeft)}</span>
			</div>

			<div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-xl z-10">
				<span className="font-inter">
					<span style={{ color: "#00C2D4" }} className="font-semibold">{cellCount}</span>
					<span className="text-white/60">/{TILE_COUNT}</span>
				</span>
			</div>

			{/* Board + tiles */}
			<div ref={boardRef} className="flex-1 relative overflow-hidden">
				{/* Сетка 3x3 — ячейки-цели с полупрозрачной подсказкой */}
				<div
					className="absolute"
					style={{
						left: "50%",
						top: "50%",
						transform: "translate(-50%, -50%)",
						display: "grid",
						gridTemplateColumns: `repeat(${GRID_SIZE}, ${PIECE_SIZE}px)`,
						gridTemplateRows: `repeat(${GRID_SIZE}, ${PIECE_SIZE}px)`,
						gap: `${GAP}px`,
					}}
				>
					{Array.from({ length: TILE_COUNT }).map((_, idx) => {
						const tileId = placedTiles[idx];
						const tile = tileId ? tiles.find((t) => t.id === tileId) : null;
						const isCorrect = tile && tile.correctIndex === idx;
						return (
							<div
								key={`cell-${idx}`}
								style={{
									width: PIECE_SIZE,
									height: PIECE_SIZE,
									border: isCorrect
										? "2px solid #2ECC71"
										: "2px dashed rgba(255,255,255,0.25)",
									borderRadius: 8,
									backgroundImage: `url(${pieceImages[idx] || ""})`,
									backgroundSize: "cover",
									opacity: isCorrect ? 1 : 0.15,
									transition: "opacity 0.3s, border-color 0.3s",
								}}
							/>
						);
					})}
				</div>

				{/* Плитки-фрагменты */}
				{tiles.map((tile) => {
					const isPlaced = placedTiles.includes(tile.id);
					if (isPlaced) return null;

					return (
						<div
							key={tile.id}
							className="absolute rounded-xl cursor-grab active:cursor-grabbing select-none"
							style={{
								width: PIECE_SIZE,
								height: PIECE_SIZE,
								left: `calc(50% + ${tile.currentPosition.x}px - ${PIECE_SIZE / 2}px)`,
								top: `calc(50% + ${tile.currentPosition.y}px - ${PIECE_SIZE / 2}px)`,
								backgroundImage: `url(${pieceImages[tile.correctIndex] || ""})`,
								backgroundSize: "cover",
								border: draggedTileId === tile.id
									? "3px solid #00C2D4"
									: "2px solid rgba(0, 194, 212, 0.6)",
								boxShadow: draggedTileId === tile.id
									? "0 0 20px rgba(0,194,212,0.5)"
									: "0 2px 8px rgba(0,0,0,0.3)",
								zIndex: draggedTileId === tile.id ? 20 : 10,
								transition: draggedTileId === tile.id ? "none" : "box-shadow 0.2s",
							}}
							onMouseDown={(e) => handleDragStart(e, tile.id)}
							onTouchStart={(e) => handleDragStart(e, tile.id)}
						/>
					);
				})}
			</div>

			{/* Skip / Завершить */}
			<div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
				{cellCount === TILE_COUNT ? (
					<button
						onClick={handleComplete}
						className="bg-[#2ECC71] text-white px-8 py-3 rounded-xl font-semibold text-base hover:bg-[#27ae60] transition-colors"
					>
						✅ Завершить сборку
					</button>
				) : (
					<button
						onClick={handleSkip}
						className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm"
					>
						Пропустить
					</button>
				)}
			</div>
		</div>
	);
}

export default AssemblyGame;