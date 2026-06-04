// ============================================
// EnterprisePanel - панель управления предприятием
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Map,
	BarChart3,
	User,
	LogOut,
	Plus,
	Edit,
	Trash2,
	Upload,
	ChevronRight,
	Loader2,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { enterprisesApi, routesApi } from "../api/client";
import { ProgressBar } from "../components/ProgressBar";

export function EnterprisePanel() {
	const navigate = useNavigate();
	const { user, isAuthenticated, logout } = useAuthStore();

	// Редирект если не авторизован
	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login");
		}
	}, [isAuthenticated, navigate]);

	const [activeTab, setActiveTab] = useState("routes");
	const [enterprises, setEnterprises] = useState([]);
	const [routes, setRoutes] = useState([]);
	const [stats, setStats] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	const tabs = [
		{ id: "routes", label: "Маршруты", icon: Map },
		{ id: "stats", label: "Статистика", icon: BarChart3 },
		{ id: "profile", label: "Профиль", icon: User },
	];

	// Загрузка данных
	useEffect(() => {
		async function loadData() {
			if (!isAuthenticated) {
				navigate("/login");
				return;
			}

			setIsLoading(true);

			try {
				// Загружаем предприятия пользователя
				const entResponse = await enterprisesApi.getAll();
				const userEnterprises = entResponse.data.filter(
					(e) => e.owner_id === user.id,
				);
				setEnterprises(userEnterprises);

				if (userEnterprises.length > 0) {
					// Загружаем маршруты первого предприятия
					const routesResponse = await enterprisesApi.getRoutes(
						userEnterprises[0].id,
					);
					setRoutes(routesResponse.data);
				}
			} catch (err) {
				console.error("[EnterprisePanel] Ошибка загрузки:", err);
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, [user, isAuthenticated, navigate]);

	// Выход
	const handleLogout = async () => {
		await logout();
		navigate("/");
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="min-h-screen bg-surface-2">
			{/* Header */}
			<header className="bg-white border-b border-surface-2 sticky top-0 z-40">
				<div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
					<h1 className="font-montserrat font-semibold text-lg text-text-main">
						Панель управления
					</h1>
					<button
						onClick={handleLogout}
						className="flex items-center gap-2 text-text-muted hover:text-error"
					>
						<LogOut size={18} />
						<span className="hidden sm:inline font-inter text-sm">Выйти</span>
					</button>
				</div>
			</header>

			{/* Tabs */}
			<div className="bg-white border-b border-surface-2">
				<div className="max-w-4xl mx-auto px-4 flex">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`
                                flex items-center gap-2 px-4 py-4 border-b-2 transition-colors
                                ${
																	activeTab === tab.id
																		? "border-primary text-primary"
																		: "border-transparent text-text-muted hover:text-text-main"
																}
                            `}
						>
							<tab.icon size={18} />
							<span className="font-inter font-medium">{tab.label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-4 py-6">
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="animate-spin text-primary" size={48} />
					</div>
				) : (
					<>
						{/* Routes tab */}
						{activeTab === "routes" && (
							<div>
								<div className="flex items-center justify-between mb-6">
									<h2 className="font-montserrat font-semibold text-xl text-text-main">
										Маршруты
									</h2>
									<button className="btn-primary flex items-center gap-2">
										<Plus size={18} />
										Новый маршрут
									</button>
								</div>

								{routes.length === 0 ? (
									<div className="bg-white rounded-2xl p-8 text-center">
										<Map className="mx-auto mb-4 text-text-muted" size={48} />
										<p className="font-inter text-text-muted">
											У вас пока нет маршрутов
										</p>
										<button className="btn-primary mt-4">
											Создать первый маршрут
										</button>
									</div>
								) : (
									<div className="space-y-4">
										{routes.map((route) => (
											<div
												key={route.id}
												className="bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
											>
												{route.cover_url && (
													<div
														className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0"
														style={{
															backgroundImage: `url(${route.cover_url})`,
														}}
													/>
												)}
												<div className="flex-1">
													<h3 className="font-montserrat font-semibold text-lg text-text-main">
														{route.title}
													</h3>
													<p className="font-inter text-sm text-text-muted">
														{route.points_count} точек
													</p>
												</div>
												<div className="flex items-center gap-2">
													<button className="p-2 hover:bg-surface-2 rounded-lg">
														<Edit size={18} className="text-text-muted" />
													</button>
													<ChevronRight size={20} className="text-text-muted" />
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Stats tab */}
						{activeTab === "stats" && (
							<div>
								<h2 className="font-montserrat font-semibold text-xl text-text-main mb-6">
									Статистика
								</h2>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
									<div className="bg-white rounded-2xl p-4">
										<p className="font-inter text-sm text-text-muted">
											Всего сессий
										</p>
										<p className="font-montserrat font-bold text-2xl text-primary">
											{stats?.totalSessions || 0}
										</p>
									</div>
									<div className="bg-white rounded-2xl p-4">
										<p className="font-inter text-sm text-text-muted">
											Завершено
										</p>
										<p className="font-montserrat font-bold text-2xl text-success">
											{stats?.completedSessions || 0}
										</p>
									</div>
									<div className="bg-white rounded-2xl p-4">
										<p className="font-inter text-sm text-text-muted">
											% завершения
										</p>
										<p className="font-montserrat font-bold text-2xl text-warning">
											{stats?.completionRate || 0}%
										</p>
									</div>
									<div className="bg-white rounded-2xl p-4">
										<p className="font-inter text-sm text-text-muted">
											Средний балл
										</p>
										<p className="font-montserrat font-bold text-2xl">
											{stats?.avgScore || 0}
										</p>
									</div>
								</div>

								<div className="bg-white rounded-2xl p-6">
									<h3 className="font-montserrat font-semibold text-lg text-text-main mb-4">
										Топ-5 точек
									</h3>
									<div className="space-y-3">
										{(stats?.topPoints || []).map((point, index) => (
											<div key={index} className="flex items-center gap-4">
												<span className="font-montserrat font-bold text-text-muted w-6">
													{index + 1}
												</span>
												<div className="flex-1">
													<p className="font-inter text-text-main">
														{point.title}
													</p>
												</div>
												<span className="font-inter text-sm text-text-muted">
													{point.visit_count} посещений
												</span>
											</div>
										))}
										{(!stats?.topPoints || stats.topPoints.length === 0) && (
											<p className="font-inter text-text-muted text-center py-4">
												Пока нет данных
											</p>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Profile tab */}
						{activeTab === "profile" && (
							<div>
								<h2 className="font-montserrat font-semibold text-xl text-text-main mb-6">
									Профиль
								</h2>

								<div className="bg-white rounded-2xl p-6">
									<div className="flex items-center gap-4 mb-6">
										<div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
											<User className="text-primary" size={32} />
										</div>
										<div>
											<h3 className="font-montserrat font-semibold text-lg text-text-main">
												{user?.name}
											</h3>
											<p className="font-inter text-sm text-text-muted">
												{user?.email}
											</p>
										</div>
									</div>

									<div className="space-y-4">
										<div>
											<label className="font-inter text-sm text-text-muted">
												Имя
											</label>
											<input
												type="text"
												defaultValue={user?.name}
												className="input-field mt-1"
											/>
										</div>
										<div>
											<label className="font-inter text-sm text-text-muted">
												Email
											</label>
											<input
												type="email"
												defaultValue={user?.email}
												className="input-field mt-1"
												disabled
											/>
										</div>
										<button className="btn-primary w-full">
											Сохранить изменения
										</button>
									</div>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export default EnterprisePanel;
