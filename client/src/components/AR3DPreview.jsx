// ============================================
// AR3DPreview - 3D превью AR модели
// Показывает 3D модель с анимацией без камеры
// Работает везде, не требует WebGL AR
// ============================================

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function AR3DPreview({
	modelType = "robot", // robot, soldier, horse, cube
	color = "#00C2D4",
	size = 2,
	autoRotate = true,
	showInfo = true,
	pointName = "",
	onClick,
}) {
	const containerRef = useRef(null);
	const sceneRef = useRef(null);
	const rendererRef = useRef(null);
	const modelRef = useRef(null);
	const animationIdRef = useRef(null);

	useEffect(() => {
		if (!containerRef.current) return;

		// Создаём сцену
		const scene = new THREE.Scene();
		sceneRef.current = scene;

		// Фон
		scene.background = new THREE.Color(0x0d1b2a);

		// Камера
		const camera = new THREE.PerspectiveCamera(
			50,
			containerRef.current.clientWidth / containerRef.current.clientHeight,
			0.1,
			1000,
		);
		camera.position.z = 5;

		// Рендерер
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(
			containerRef.current.clientWidth,
			containerRef.current.clientHeight,
		);
		renderer.setPixelRatio(window.devicePixelRatio);
		containerRef.current.appendChild(renderer.domElement);
		rendererRef.current = renderer;

		// Освещение
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(5, 5, 5);
		scene.add(directionalLight);

		const pointLight = new THREE.PointLight(0x00c2d4, 1, 10);
		pointLight.position.set(-3, 2, 2);
		scene.add(pointLight);

		// Модель на основе типа
		let model;
		const primaryColor = new THREE.Color(color);

		switch (modelType) {
			case "robot":
				model = createRobot(primaryColor);
				break;
			case "soldier":
				model = createSoldier(primaryColor);
				break;
			case "horse":
				model = createHorse(primaryColor);
				break;
			case "furnace":
				model = createFurnace(primaryColor);
				break;
			case "gear":
				model = createGear(primaryColor);
				break;
			default:
				model = createCube(primaryColor);
		}

		modelRef.current = model;
		scene.add(model);

		// Плавающие частицы
		const particles = createParticles(primaryColor);
		scene.add(particles);

		// Анимация
		const animate = () => {
			animationIdRef.current = requestAnimationFrame(animate);

			if (modelRef.current && autoRotate) {
				modelRef.current.rotation.y += 0.01;
			}

			// Анимация частиц
			if (particles) {
				particles.rotation.y += 0.002;
				particles.rotation.x += 0.001;
			}

			renderer.render(scene, camera);
		};

		animate();

		// Resize handler
		const handleResize = () => {
			if (!containerRef.current) return;
			camera.aspect =
				containerRef.current.clientWidth / containerRef.current.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(
				containerRef.current.clientWidth,
				containerRef.current.clientHeight,
			);
		};

		window.addEventListener("resize", handleResize);

		// Cleanup
		return () => {
			window.removeEventListener("resize", handleResize);
			if (animationIdRef.current) {
				cancelAnimationFrame(animationIdRef.current);
			}
			if (containerRef.current && rendererRef.current) {
				containerRef.current.removeChild(rendererRef.current.domElement);
			}
			renderer.dispose();
		};
	}, [modelType, color, autoRotate]);

	return (
		<div className="relative w-full h-full">
			<div
				ref={containerRef}
				className="w-full h-full cursor-pointer"
				onClick={onClick}
			/>

			{showInfo && (
				<div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-3">
					<p className="text-white font-semibold text-sm">
						{pointName || "3D Модель"}
					</p>
					<p className="text-primary text-xs">
						{autoRotate ? "⟳ Автовращение" : "Используйте мышь для вращения"}
					</p>
				</div>
			)}

			{/* Glow effect */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					boxShadow: `inset 0 0 60px ${color}33`,
					borderRadius: "inherit",
				}}
			/>
		</div>
	);
}

// Создание робота
function createRobot(color) {
	const group = new THREE.Group();

	// Тело
	const bodyGeo = new THREE.BoxGeometry(1.2, 1.5, 0.6);
	const bodyMat = new THREE.MeshPhongMaterial({ color: color });
	const body = new THREE.Mesh(bodyGeo, bodyMat);
	body.position.y = 0;
	group.add(body);

	// Голова
	const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.6);
	const headMat = new THREE.MeshPhongMaterial({ color: color });
	const head = new THREE.Mesh(headGeo, headMat);
	head.position.y = 1.2;
	group.add(head);

	// Глаза
	const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
	const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
	leftEye.position.set(-0.2, 1.3, 0.3);
	group.add(leftEye);

	const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
	rightEye.position.set(0.2, 1.3, 0.3);
	group.add(rightEye);

	// Руки
	const armGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
	const armMat = new THREE.MeshPhongMaterial({ color: color });
	const leftArm = new THREE.Mesh(armGeo, armMat);
	leftArm.position.set(-0.9, 0, 0);
	group.add(leftArm);

	const rightArm = new THREE.Mesh(armGeo, armMat);
	rightArm.position.set(0.9, 0, 0);
	group.add(rightArm);

	// Ноги
	const legGeo = new THREE.BoxGeometry(0.35, 1, 0.35);
	const legMat = new THREE.MeshPhongMaterial({ color: color });
	const leftLeg = new THREE.Mesh(legGeo, legMat);
	leftLeg.position.set(-0.3, -1.2, 0);
	group.add(leftLeg);

	const rightLeg = new THREE.Mesh(legGeo, legMat);
	rightLeg.position.set(0.3, -1.2, 0);
	group.add(rightLeg);

	return group;
}

// Создание солдата
function createSoldier(color) {
	const group = new THREE.Group();

	// Тело
	const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
	const bodyMat = new THREE.MeshPhongMaterial({ color: color });
	const body = new THREE.Mesh(bodyGeo, bodyMat);
	group.add(body);

	// Голова
	const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
	const headMat = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
	const head = new THREE.Mesh(headGeo, headMat);
	head.position.y = 1.3;
	group.add(head);

	// Шлем
	const helmetGeo = new THREE.SphereGeometry(
		0.4,
		16,
		8,
		0,
		Math.PI * 2,
		0,
		Math.PI / 2,
	);
	const helmetMat = new THREE.MeshPhongMaterial({ color: color });
	const helmet = new THREE.Mesh(helmetGeo, helmetMat);
	helmet.position.y = 1.35;
	group.add(helmet);

	return group;
}

// Создание лошади
function createHorse(color) {
	const group = new THREE.Group();

	// Тело
	const bodyGeo = new THREE.BoxGeometry(2, 1, 0.8);
	const bodyMat = new THREE.MeshPhongMaterial({ color: color });
	const body = new THREE.Mesh(bodyGeo, bodyMat);
	body.rotation.z = 0.2;
	group.add(body);

	// Голова
	const headGeo = new THREE.BoxGeometry(0.8, 0.4, 0.5);
	const head = new THREE.Mesh(headGeo, bodyMat);
	head.position.set(1.2, 0.3, 0);
	head.rotation.z = 0.3;
	group.add(head);

	// Ноги
	const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
	const legMat = new THREE.MeshPhongMaterial({ color: color });

	const positions = [
		[-0.7, -0.8, 0.25],
		[-0.7, -0.8, -0.25],
		[0.7, -0.8, 0.25],
		[0.7, -0.8, -0.25],
	];

	positions.forEach((pos) => {
		const leg = new THREE.Mesh(legGeo, legMat);
		leg.position.set(...pos);
		group.add(leg);
	});

	return group;
}

// Создание доменной печи
function createFurnace(color) {
	const group = new THREE.Group();

	// Основание
	const baseGeo = new THREE.CylinderGeometry(1, 1.2, 0.5, 16);
	const baseMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
	const base = new THREE.Mesh(baseGeo, baseMat);
	base.position.y = -0.5;
	group.add(base);

	// Основная часть
	const bodyGeo = new THREE.CylinderGeometry(0.8, 1, 2, 16);
	const bodyMat = new THREE.MeshPhongMaterial({ color: color });
	const body = new THREE.Mesh(bodyGeo, bodyMat);
	body.position.y = 0.5;
	group.add(body);

	// Верх (сужается)
	const topGeo = new THREE.CylinderGeometry(0.3, 0.8, 1, 16);
	const top = new THREE.Mesh(topGeo, bodyMat);
	top.position.y = 2;
	group.add(top);

	// Огонь внутри
	const fireGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
	const fireMat = new THREE.MeshBasicMaterial({
		color: 0xff6600,
		transparent: true,
		opacity: 0.8,
	});
	const fire = new THREE.Mesh(fireGeo, fireMat);
	fire.position.y = 0.8;
	group.add(fire);

	return group;
}

// Создание шестерни
function createGear(color) {
	const group = new THREE.Group();

	// Диск
	const discGeo = new THREE.CylinderGeometry(1, 1, 0.3, 32);
	const discMat = new THREE.MeshPhongMaterial({ color: color });
	const disc = new THREE.Mesh(discGeo, discMat);
	disc.rotation.x = Math.PI / 2;
	group.add(disc);

	// Зубья
	const teethCount = 12;
	for (let i = 0; i < teethCount; i++) {
		const angle = (i / teethCount) * Math.PI * 2;
		const toothGeo = new THREE.BoxGeometry(0.2, 0.4, 0.3);
		const tooth = new THREE.Mesh(toothGeo, discMat);
		tooth.position.x = Math.cos(angle) * 1.1;
		tooth.position.y = Math.sin(angle) * 1.1;
		tooth.rotation.z = angle;
		group.add(tooth);
	}

	// Центральное отверстие
	const holeGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
	const holeMat = new THREE.MeshBasicMaterial({ color: 0x0d1b2a });
	const hole = new THREE.Mesh(holeGeo, holeMat);
	hole.position.z = 0.16;
	group.add(hole);

	return group;
}

// Создание куба
function createCube(color) {
	const group = new THREE.Group();

	const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
	const mat = new THREE.MeshPhongMaterial({
		color: color,
		transparent: true,
		opacity: 0.9,
		wireframe: false,
	});
	const cube = new THREE.Mesh(geo, mat);
	group.add(cube);

	// Wireframe overlay
	const wireframe = new THREE.LineSegments(
		new THREE.EdgesGeometry(geo),
		new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }),
	);
	group.add(wireframe);

	return group;
}

// Создание частиц
function createParticles(color) {
	const count = 50;
	const positions = new Float32Array(count * 3);

	for (let i = 0; i < count; i++) {
		positions[i * 3] = (Math.random() - 0.5) * 10;
		positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
		positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

	const material = new THREE.PointsMaterial({
		color: color,
		size: 0.05,
		transparent: true,
		opacity: 0.6,
	});

	return new THREE.Points(geometry, material);
}

export default AR3DPreview;
