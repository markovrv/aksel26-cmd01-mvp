// ============================================
// StartTour Page - выбор маршрута и начало экскурсии
// ============================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { enterprisesApi, routesApi } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

export function StartTour() {
	const { enterpriseId } = useParams();
	const navigate = useNavigate();

	const [enterprise, setEnterprise] = useState(null);
	const [routes, setRoutes] = useState([]);
	const [selectedRouteId, setSelectedRouteId] = useState(null);
	const [visitorName, setVisitorName] = useState("");
	const [nameError, setNameError] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isStarting, setIsStarting] = useState(false);

	const { startSession } = useSessionStore();

	// Загрузка данных
	useEffect(() => {
		async function loadData() {
			setIsLoading(true);
			setError(null);

			try {
				// Загружаем предприятие
				const enterpriseResponse = await enterprisesApi.getById(enterpriseId);
				setEnterprise(enterpriseResponse.data);

				// Загружаем маршруты
				const routesResponse = await enterprisesApi.getRoutes(enterpriseId);
				setRoutes(routesResponse.data);
			} catch (err) {
				console.error("[StartTour] Ошибка загрузки:", err);
				setError(err.message || "Не удалось загрузить данные");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, [enterpriseId]);

	// Валидация имени
	const validateName = (name) => {
		if (name.length > 0 && name.length < 2) {
			setNameError("Минимум 2 символа");
			return false;
		}
		setNameError("");
		return true;
	};

	// Обработка ввода имени
	const handleNameChange = (e) => {
		const value = e.target.value;
		setVisitorName(value);
		if (value) validateName(value);
	};

	// Начать экскурсию
	const handleStartTour = async () => {
		// Валидация
		if (visitorName.length < 2) {
			setNameError("Минимум 2 символа");
			return;
		}

		if (!selectedRouteId) return;

		setIsStarting(true);

		try {
			const sessionId = await startSession(
				visitorName,
				parseInt(enterpriseId),
				selectedRouteId,
			);
			navigate(`/tour/${sessionId}`);
		} catch (err) {
			console.error("[StartTour] Ошибка начала сессии:", err);
			setError(err.message || "Не удалось начать экскурсию");
			setIsStarting(false);
		}
	};

	// Состояние загрузки
	if (isLoading) {
		return (
			<div className="min-h-screen bg-ar-bg flex items-center justify-center">
				<div className="text-center">
					<Loader2
						className="animate-spin text-primary mx-auto mb-4"
						size={48}
					/>
					<p className="font-inter text-text-muted">Загрузка...</p>
				</div>
			</div>
		);
	}

	// Состояние ошибки
	if (error) {
		return (
			<div className="min-h-screen bg-ar-bg flex items-center justify-center p-4">
				<div className="text-center max-w-sm">
					<div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<span className="text-error text-2xl">!</span>
					</div>
					<h2 className="font-montserrat font-semibold text-xl text-white mb-2">
						{error.includes("404")
							? "Предприятие не найдено"
							: "Произошла ошибка"}
					</h2>
					<p className="font-inter text-text-muted mb-6">
						{error.includes("404")
							? "Возможно, ссылка устарела или неверна"
							: error}
					</p>
					<button onClick={() => navigate("/")} className="btn-primary">
						На главную
					</button>
				</div>
			</div>
		);
	}

	// Нет маршрутов
	if (routes.length === 0) {
		return (
			<div className="min-h-screen bg-ar-bg flex items-center justify-center p-4">
				<div className="text-center max-w-sm">
					<div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<MapPin className="text-warning" size={32} />
					</div>
					<h2 className="font-montserrat font-semibold text-xl text-white mb-2">
						Маршруты временно недоступны
					</h2>
					<p className="font-inter text-text-muted mb-6">
						Это предприятие пока не настроило экскурсии
					</p>
					<button onClick={() => navigate("/")} className="btn-primary">
						На главную
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-ar-bg pb-8">
			{/* Header */}
			<header className="pt-8 pb-6 px-4 text-center">
				{/* Logo */}
				{enterprise?.logo_url ? (
					<img
						src={enterprise.logo_url}
						alt={enterprise.name}
						className="w-20 h-20 rounded-2xl mx-auto mb-4 object-contain bg-white"
					/>
				) : (
					<div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<Building2 className="text-primary" size={40} />
					</div>
				)}

				<h1 className="font-montserrat font-semibold text-2xl text-white mb-2">
					{enterprise?.name || "Загрузка..."}
				</h1>
				{enterprise?.city && (
					<p className="font-inter text-text-muted">{enterprise.city}</p>
				)}
			</header>

			{/* Form */}
			<div className="max-w-md mx-auto px-4">
				{/* Name input */}
				<div className="mb-6">
					<label className="block font-inter text-sm text-text-muted mb-2">
						Ваше имя
					</label>
					<input
						type="text"
						value={visitorName}
						onChange={handleNameChange}
						placeholder="Введите имя"
						className={`
                            input-field
                            ${nameError ? "input-error" : ""}
                        `}
					/>
					{nameError && (
						<p className="font-inter text-sm text-error mt-1">{nameError}</p>
					)}
				</div>

				{/* Routes */}
				<div className="mb-6">
					<label className="block font-inter text-sm text-text-muted mb-3">
						Выберите маршрут
					</label>

					<div className="space-y-3">
						{routes.map((route) => (
							<button
								key={route.id}
								onClick={() => setSelectedRouteId(route.id)}
								className={`
                                    w-full p-4 rounded-2xl border-2 transition-all text-left
                                    ${
																			selectedRouteId === route.id
																				? "border-primary bg-primary/10"
																				: "border-surface-2 hover:border-primary/50"
																		}
                                `}
							>
								{route.cover_url && (
									<div
										className="w-full h-32 rounded-xl mb-3 bg-cover bg-center"
										style={{ backgroundImage: `url(${route.cover_url})` }}
									/>
								)}
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="font-montserrat font-semibold text-lg text-white">
											{route.title}
										</h3>
										<p className="font-inter text-sm text-text-muted mt-1">
											{route.description}
										</p>
									</div>
									<div className="flex items-center gap-1 text-text-muted text-sm ml-4">
										<MapPin size={14} />
										<span>{route.points_count} точек</span>
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Start button */}
				<button
					onClick={handleStartTour}
					disabled={
						!visitorName ||
						visitorName.length < 2 ||
						!selectedRouteId ||
						isStarting
					}
					className="btn-primary w-full flex items-center justify-center gap-2"
				>
					{isStarting ? (
						<>
							<Loader2 className="animate-spin" size={20} />
							Запуск...
						</>
					) : (
						<>
							Начать экскурсию
							<ArrowRight size={20} />
						</>
					)}
				</button>
			</div>
		</div>
	);
}

export default StartTour;
