// ============================================
// ApplicationModal - форма сбора заявок
// ============================================

import { useState, useEffect } from "react";
import { X, Send, CheckCircle, AlertCircle } from "lucide-react";

export function ApplicationModal({ isOpen, onClose }) {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		company: "",
		message: "",
	});
	const [status, setStatus] = useState("idle"); // idle, submitting, success, error
	const [errors, setErrors] = useState({});

	// Закрытие по Escape и блокировка скролла
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const validate = () => {
		const newErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = "Введите имя";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Введите email";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Некорректный email";
		}

		if (!formData.phone.trim()) {
			newErrors.phone = "Введите телефон";
		} else if (!/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
			newErrors.phone = "Некорректный номер";
		}

		if (!formData.company.trim()) {
			newErrors.company = "Введите название компании";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validate()) return;

		setStatus("submitting");

		// Имитация отправки (в реальности - POST на API)
		try {
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Успех
			setStatus("success");
			setFormData({
				name: "",
				email: "",
				phone: "",
				company: "",
				message: "",
			});

			// Закрываем через 3 секунды
			setTimeout(() => {
				onClose();
				setStatus("idle");
			}, 3000);
		} catch (err) {
			setStatus("error");
		}
	};

	const handleChange = (field) => (e) => {
		setFormData({ ...formData, [field]: e.target.value });
		if (errors[field]) {
			setErrors({ ...errors, [field]: null });
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/70 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg bg-ar-card rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-ar-card p-6 border-b border-white/10 flex items-center justify-between">
					<div>
						<h2 className="font-montserrat font-bold text-2xl text-white">
							Оставить заявку
						</h2>
						<p className="font-inter text-text-muted text-sm mt-1">
							Мы свяжемся с вами в течение рабочего дня
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-xl hover:bg-white/10 transition-colors"
					>
						<X className="text-text-muted" size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{status === "success" ? (
						<div className="text-center py-8">
							<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="text-green-400" size={40} />
							</div>
							<h3 className="font-montserrat font-bold text-xl text-white mb-2">
								Заявка отправлена!
							</h3>
							<p className="font-inter text-text-muted">
								Наш менеджер свяжется с вами в ближайшее время.
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-5">
							{status === "error" && (
								<div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
									<AlertCircle className="text-red-400" size={20} />
									<span className="text-red-400 font-inter text-sm">
										Что-то пошло не так. Попробуйте ещё раз.
									</span>
								</div>
							)}

							<div>
								<label className="block font-inter text-text-muted text-sm mb-2">
									Ваше имя *
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={handleChange("name")}
									className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white font-inter placeholder:text-text-muted/50 focus:outline-none transition-colors ${
										errors.name
											? "border-red-500 focus:border-red-500"
											: "border-white/20 focus:border-primary"
									}`}
									placeholder="Иван Петров"
								/>
								{errors.name && (
									<p className="text-red-400 text-xs mt-1">{errors.name}</p>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block font-inter text-text-muted text-sm mb-2">
										Email *
									</label>
									<input
										type="email"
										value={formData.email}
										onChange={handleChange("email")}
										className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white font-inter placeholder:text-text-muted/50 focus:outline-none transition-colors ${
											errors.email
												? "border-red-500 focus:border-red-500"
												: "border-white/20 focus:border-primary"
										}`}
										placeholder="email@company.ru"
									/>
									{errors.email && (
										<p className="text-red-400 text-xs mt-1">{errors.email}</p>
									)}
								</div>

								<div>
									<label className="block font-inter text-text-muted text-sm mb-2">
										Телефон *
									</label>
									<input
										type="tel"
										value={formData.phone}
										onChange={handleChange("phone")}
										className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white font-inter placeholder:text-text-muted/50 focus:outline-none transition-colors ${
											errors.phone
												? "border-red-500 focus:border-red-500"
												: "border-white/20 focus:border-primary"
										}`}
										placeholder="+7 (999) 123-45-67"
									/>
									{errors.phone && (
										<p className="text-red-400 text-xs mt-1">{errors.phone}</p>
									)}
								</div>
							</div>

							<div>
								<label className="block font-inter text-text-muted text-sm mb-2">
									Компания *
								</label>
								<input
									type="text"
									value={formData.company}
									onChange={handleChange("company")}
									className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white font-inter placeholder:text-text-muted/50 focus:outline-none transition-colors ${
										errors.company
											? "border-red-500 focus:border-red-500"
											: "border-white/20 focus:border-primary"
									}`}
									placeholder="ООО «ПромИндустрия»"
								/>
								{errors.company && (
									<p className="text-red-400 text-xs mt-1">{errors.company}</p>
								)}
							</div>

							<div>
								<label className="block font-inter text-text-muted text-sm mb-2">
									Комментарий
								</label>
								<textarea
									value={formData.message}
									onChange={handleChange("message")}
									rows={3}
									className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-inter placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
									placeholder="Расскажите о вашем проекте..."
								/>
							</div>

							<button
								type="submit"
								disabled={status === "submitting"}
								className="w-full bg-primary text-white py-4 rounded-xl font-montserrat font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{status === "submitting" ? (
									<>
										<span className="animate-spin">⟳</span>
										Отправка...
									</>
								) : (
									<>
										<Send size={18} />
										Отправить заявку
									</>
								)}
							</button>

							<p className="text-center font-inter text-text-muted text-xs">
								Нажимая кнопку, вы соглашаетесь с{" "}
								<a href="#" className="text-primary hover:underline">
									политикой конфиденциальности
								</a>
							</p>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

export default ApplicationModal;
