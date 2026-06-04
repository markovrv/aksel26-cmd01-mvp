// ============================================
// AdminPanel - панель администратора
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Building2,
	Users,
	Activity,
	Settings,
	LogOut,
	Loader2,
	Ban,
	CheckCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { adminApi } from "../api/client";

export function AdminPanel() {
	const navigate = useNavigate();
	const { user, isAuthenticated, logout } = useAuthStore();

	// Редирект если не авторизован или не админ
	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login");
		} else if (user?.role !== "admin") {
			navigate("/enterprise-panel");
		}
	}, [isAuthenticated, user, navigate]);

	const [activeTab, setActiveTab] = useState("enterprises");
	const [users, setUsers] = useState([]);
	const [stats, setStats] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	const tabs = [
		{ id: "enterprises", label: "Предприятия", icon: Building2 },
		{ id: "users", label: "Пользователи", icon: Users },
		{ id: "stats", label: "Статистика", icon: Activity },
	];

	// Загрузка данных
	useEffect(() => {
		async function loadData() {
			if (!isAuthenticated) {
				navigate("/login");
				return;
			}

			if (user?.role !== "admin") {
				navigate("/");
				return;
			}

			setIsLoading(true);

			try {
				const [usersResponse, statsResponse] = await Promise.all([
					adminApi.getUsers(),
					adminApi.getStats(),
				]);

				setUsers(usersResponse.data);
				setStats(statsResponse.data);
			} catch (err) {
				console.error("[AdminPanel] Ошибка загрузки:", err);
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, [user, isAuthenticated, navigate]);

	// Блокировка пользователя
	const handleToggleBlock = async (userId) => {
		try {
			const response = await adminApi.blockUser(userId);

			setUsers((prev) =>
				prev.map((u) =>
					u.id === userId
						? { ...u, is_blocked: response.data.isBlocked ? 1 : 0 }
						: u,
				),
			);
		} catch (err) {
			console.error("[AdminPanel] Ошибка блокировки:", err);
		}
	};

	// Выход
	const handleLogout = async () => {
		await logout();
		navigate("/");
	};

	if (!isAuthenticated || user?.role !== "admin") {
		return null;
	}

	return (
		<div className="min-h-screen bg-surface-2">
			{/* Header */}
			<header className="bg-white border-b border-surface-2 sticky top-0 z-40">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
					<h1 className="font-montserrat font-semibold text-lg text-text-main">
						Админ-панель
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
				<div className="max-w-6xl mx-auto px-4 flex overflow-x-auto">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`
                                flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap
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
			<div className="max-w-6xl mx-auto px-4 py-6">
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="animate-spin text-primary" size={48} />
					</div>
				) : (
					<>
						{/* Enterprises tab */}
						{activeTab === "enterprises" && (
							<div>
								<h2 className="font-montserrat font-semibold text-xl text-text-main mb-6">
									Предприятия
								</h2>

								<div className="bg-white rounded-2xl overflow-hidden">
									<table className="w-full">
										<thead className="bg-surface-2">
											<tr>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Название
												</th>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Город
												</th>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Отрасль
												</th>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Действия
												</th>
											</tr>
										</thead>
										<tbody>
											{stats?.topRoutes?.map((route, index) => (
												<tr key={index} className="border-t border-surface-2">
													<td className="px-6 py-4 font-inter text-text-main">
														{route.enterprise}
													</td>
													<td className="px-6 py-4 font-inter text-text-muted">
														—
													</td>
													<td className="px-6 py-4 font-inter text-text-muted">
														—
													</td>
													<td className="px-6 py-4">
														<button className="text-error hover:underline font-inter text-sm">
															Удалить
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* Users tab */}
						{activeTab === "users" && (
							<div>
								<h2 className="font-montserrat font-semibold text-xl text-text-main mb-6">
									Пользователи
								</h2>

								<div className="bg-white rounded-2xl overflow-hidden">
									<table className="w-full">
										<thead className="bg-surface-2">
											<tr>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Email
												</th>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Роль
												</th>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Статус
												</th>
												<th className="text-left px-6 py-3 font-inter text-sm text-text-muted">
													Действия
												</th>
											</tr>
										</thead>
										<tbody>
											{users.map((u) => (
												<tr key={u.id} className="border-t border-surface-2">
													<td className="px-6 py-4 font-inter text-text-main">
														{u.email}
													</td>
													<td className="px-6 py-4">
														<span
															className={`
                                                            inline-block px-2 py-1 rounded text-xs font-medium
                                                            ${
																															u.role === "admin"
																																? "bg-error/10 text-error"
																																: "bg-primary/10 text-primary"
																														}
                                                        `}
														>
															{u.role === "admin" ? "Админ" : "Предприятие"}
														</span>
													</td>
													<td className="px-6 py-4">
														{u.is_blocked ? (
															<span className="inline-flex items-center gap-1 text-error text-sm">
																<Ban size={14} /> Заблокирован
															</span>
														) : (
															<span className="inline-flex items-center gap-1 text-success text-sm">
																<CheckCircle size={14} /> Активен
															</span>
														)}
													</td>
													<td className="px-6 py-4">
														{u.id !== user.id && (
															<button
																onClick={() => handleToggleBlock(u.id)}
																className="text-primary hover:underline font-inter text-sm"
															>
																{u.is_blocked
																	? "Разблокировать"
																	: "Заблокировать"}
															</button>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* Stats tab */}
						{activeTab === "stats" && (
							<div>
								<h2 className="font-montserrat font-semibold text-xl text-text-main mb-6">
									Статистика платформы
								</h2>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
									<div className="bg-white rounded-2xl p-6">
										<p className="font-inter text-sm text-text-muted">
											Всего сессий
										</p>
										<p className="font-montserrat font-bold text-3xl text-primary">
											{stats?.sessions?.total || 0}
										</p>
									</div>
									<div className="bg-white rounded-2xl p-6">
										<p className="font-inter text-sm text-text-muted">
											Завершено
										</p>
										<p className="font-montserrat font-bold text-3xl text-success">
											{stats?.sessions?.completed || 0}
										</p>
									</div>
									<div className="bg-white rounded-2xl p-6">
										<p className="font-inter text-sm text-text-muted">
											% завершения
										</p>
										<p className="font-montserrat font-bold text-3xl text-warning">
											{stats?.sessions?.completionRate || 0}%
										</p>
									</div>
									<div className="bg-white rounded-2xl p-6">
										<p className="font-inter text-sm text-text-muted">
											Предприятий
										</p>
										<p className="font-montserrat font-bold text-3xl">
											{stats?.content?.enterprises || 0}
										</p>
									</div>
								</div>

								<div className="grid md:grid-cols-2 gap-6">
									<div className="bg-white rounded-2xl p-6">
										<h3 className="font-montserrat font-semibold text-lg text-text-main mb-4">
											Контент
										</h3>
										<div className="space-y-3">
											<div className="flex justify-between">
												<span className="font-inter text-text-muted">
													Маршрутов
												</span>
												<span className="font-montserrat font-semibold">
													{stats?.content?.routes || 0}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="font-inter text-text-muted">
													Точек
												</span>
												<span className="font-montserrat font-semibold">
													{stats?.content?.points || 0}
												</span>
											</div>
										</div>
									</div>

									<div className="bg-white rounded-2xl p-6">
										<h3 className="font-montserrat font-semibold text-lg text-text-main mb-4">
											Пользователи
										</h3>
										<div className="space-y-3">
											<div className="flex justify-between">
												<span className="font-inter text-text-muted">
													Всего
												</span>
												<span className="font-montserrat font-semibold">
													{stats?.users?.total || 0}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="font-inter text-text-muted">
													Предприятий
												</span>
												<span className="font-montserrat font-semibold">
													{stats?.users?.enterprises || 0}
												</span>
											</div>
										</div>
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

export default AdminPanel;
