// ============================================
// Login Page - авторизация пользователей
// ============================================

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Building2, AlertCircle, Loader2 } from "lucide-react";

export function Login() {
	const navigate = useNavigate();
	const { login } = useAuthStore();
	const [formData, setFormData] = useState({ email: "", password: "" });
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const user = await login(formData.email, formData.password);

			// Редирект в зависимости от роли
			if (user.role === "admin") {
				navigate("/admin-panel");
			} else if (user.role === "enterprise") {
				navigate("/enterprise-panel");
			} else {
				navigate("/");
			}
		} catch (err) {
			console.error("[Login] Error:", err);
			setError(
				err.response?.data?.error || err.message || "Неверный email или пароль",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-ar-bg flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				{/* Logo */}
				<Link to="/" className="flex items-center justify-center gap-3 mb-8">
					<Building2 className="text-primary" size={40} />
					<span className="font-montserrat font-semibold text-white text-2xl">
						Индустриальный гид
					</span>
				</Link>

				{/* Form */}
				<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
					<h1 className="font-montserrat font-bold text-2xl text-white text-center mb-6">
						Вход в систему
					</h1>

					{error && (
						<div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
							<AlertCircle className="text-red-400" size={20} />
							<span className="text-red-400 font-inter text-sm">{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label
								htmlFor="email"
								className="block font-inter text-white/80 text-sm mb-2"
							>
								Email
							</label>
							<input
								type="email"
								id="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-inter placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
								placeholder="your@email.com"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block font-inter text-white/80 text-sm mb-2"
							>
								Пароль
							</label>
							<input
								type="password"
								id="password"
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
								className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-inter placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
								placeholder="••••••••"
								required
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full bg-primary text-white py-3 rounded-xl font-montserrat font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isLoading ? (
								<>
									<Loader2 className="animate-spin" size={20} />
									Вход...
								</>
							) : (
								"Войти"
							)}
						</button>
					</form>

					{/* Demo credentials */}
					<div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/30">
						<p className="font-inter text-white/80 text-sm mb-3">
							Демо-доступ:
						</p>
						<div className="space-y-2 text-sm font-mono">
							<p className="text-primary">
								Админ: admin@arguide.ru / Admin123!
							</p>
							<p className="text-primary">
								Менеджер: metall@arguide.ru / Metall456!
							</p>
						</div>
					</div>
				</div>

				{/* Back link */}
				<Link
					to="/"
					className="block text-center text-white/70 font-inter text-sm mt-6 hover:text-primary transition-colors"
				>
					← На главную
				</Link>
			</div>
		</div>
	);
}

export default Login;
