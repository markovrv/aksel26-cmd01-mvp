// ============================================
// ARScene Component - A-Frame сцена с AR.js
// Использует реальные 3D модели из /public/models/
// AR.js загружается через CDN
// ============================================

import { useEffect, useRef, useState } from "react";

// Глобальные объекты из CDN
const AFRAME = window.AFRAME;

// Карта моделей для разных типов точек
const MODEL_MAP = {
	furnace: "/models/robot.glb",
	assembly: "/models/soldier.glb",
	default: "/models/horse.glb",
};

// AR store для отслеживания обнаруженных маркеров
export const useARStore = {
	activeMarkerId: null,
	detectedMarkers: [],
	listeners: new Set(),

	setActiveMarker(markerId) {
		this.activeMarkerId = markerId;
		this.notify();
	},

	clearActiveMarker() {
		this.activeMarkerId = null;
		this.notify();
	},

	addDetectedMarker(markerId) {
		if (!this.detectedMarkers.includes(markerId)) {
			this.detectedMarkers.push(markerId);
			this.notify();
		}
	},

	reset() {
		this.activeMarkerId = null;
		this.detectedMarkers = [];
		this.notify();
	},

	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	},

	notify() {
		this.listeners.forEach((listener) => listener());
	},
};

// Компонент AR-сцены
export function ARScene({
	points = [],
	visitedPointIds = [],
	onMarkerFound,
	onMarkerLost,
}) {
	const sceneRef = useRef(null);

	useEffect(() => {
		return () => {
			useARStore.reset();
		};
	}, []);

	if (!AFRAME) {
		return (
			<div className="w-full h-full flex items-center justify-center bg-ar-bg">
				<div className="text-center">
					<div className="animate-spin text-4xl mb-4">⟳</div>
					<p className="text-text-muted">Загрузка AR...</p>
				</div>
			</div>
		);
	}

	return (
		<a-scene
			ref={sceneRef}
			embedded
			arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
			vr-mode-ui="enabled: false"
			renderer="logarithmicDepthBuffer: true; precision: medium;"
			class="w-full h-full"
		>
			{/* Камера */}
			<a-entity camera />

			{/* Точки/маркеры */}
			{points.map((point) => (
				<ARMarker
					key={point.id}
					point={point}
					isVisited={visitedPointIds.includes(point.id)}
					onFound={() => onMarkerFound?.(point)}
					onLost={() => onMarkerLost?.(point)}
				/>
			))}
		</a-scene>
	);
}

// Компонент отдельного маркера с 3D моделью
export function ARMarker({ point, isVisited, onFound, onLost }) {
	const markerRef = useRef(null);
	const [modelLoaded, setModelLoaded] = useState(false);
	const [modelError, setModelError] = useState(false);

	// Определяем модель по типу точки
	const getModelUrl = (pointType) => {
		return MODEL_MAP[pointType] || MODEL_MAP.default;
	};

	useEffect(() => {
		const marker = markerRef.current;
		if (!marker) return;

		const handleFound = () => {
			useARStore.setActiveMarker(point.marker_id);
			useARStore.addDetectedMarker(point.marker_id);
			onFound?.();
		};

		const handleLost = () => {
			if (useARStore.activeMarkerId === point.marker_id) {
				useARStore.clearActiveMarker();
			}
			onLost?.();
		};

		marker.addEventListener("markerFound", handleFound);
		marker.addEventListener("markerLost", handleLost);

		return () => {
			marker.removeEventListener("markerFound", handleFound);
			marker.removeEventListener("markerLost", handleLost);
		};
	}, [point, onFound, onLost]);

	const modelUrl = getModelUrl(point.point_type);
	const primaryColor = isVisited ? "#2ECC71" : "#00C2D4";

	return (
		<a-marker
			ref={markerRef}
			type="pattern"
			url={`/markers/${point.marker_id || "hiro"}.patt`}
			smooth="true"
			smoothCount="5"
			smoothTolerance="0.01"
			smoothThreshold="2"
		>
			{/* 3D модель (пробуем загрузить реальную) */}
			<a-entity
				gltf-model={modelUrl}
				scale="0.3 0.3 0.3"
				position="0 0.15 0"
				animation="property: rotation; from: 0 0 0; to: 0 360 0; dur: 10000; loop: true; easing: linear"
				onModelLoaded={() => setModelLoaded(true)}
				onModelError={() => setModelError(true)}
				class={isVisited ? "visited-model" : ""}
			/>

			{/* Fallback: анимированный куб если модель не загрузилась */}
			{(modelError || !modelLoaded) && (
				<a-box
					position="0 0.3 0"
					color={primaryColor}
					opacity="0.9"
					animation="property: rotation; to: 360 360 0; dur: 3000; loop: true; easing: linear"
				/>
			)}

			{/* Индикатор загрузки */}
			{!modelLoaded && !modelError && (
				<a-ring
					position="0 0.5 0"
					rotation="-90 0 0"
					radius-inner="0.1"
					radius-outer="0.15"
					color="#FFD700"
					animation="property: opacity; from: 1; to: 0.3; dur: 500; loop: true"
				/>
			)}

			{/* Текстовая метка с названием */}
			<a-text
				value={point.title}
				position="0 0.6 0"
				align="center"
				color={primaryColor}
				width="3"
				font="mozillavr"
			/>

			{/* Описание */}
			<a-text
				value={point.description?.substring(0, 50) + "..."}
				position="0 0.45 0"
				align="center"
				color="#AAAAAA"
				width="2"
				font="mozillavr"
			/>

			{/* Индикатор посещения */}
			{isVisited && (
				<a-ring
					position="0 0.01 0"
					rotation="-90 0 0"
					radius-inner="0.2"
					radius-outer="0.25"
					color="#2ECC71"
					opacity="0.8"
					animation="property: scale; from: 0.8 0.8 0.8; to: 1 1 1; dur: 300; easing: easeOutQuad"
				/>
			)}
		</a-marker>
	);
}

export default ARScene;
