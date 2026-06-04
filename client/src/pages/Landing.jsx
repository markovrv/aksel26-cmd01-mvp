// ============================================
// Landing Page - главная страница
// ============================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { QrCode, Camera, Trophy, Building2, ArrowRight } from "lucide-react";
import ApplicationModal from "../components/ApplicationModal";

export function Landing() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const features = [
		{
			icon: QrCode,
			title: "Сканируй QR",
			text: "Наведи камеру на код у входа",
		},
		{
			icon: Camera,
			title: "Наводи камеру",
			text: "3D-модели оживают поверх оборудования",
		},
		{
			icon: Trophy,
			title: "Получай сертификат",
			text: "Цифровое подтверждение прохождения",
		},
	];

	const pricing = [
		{
			name: "Старт",
			price: "Бесплатно",
			features: ["1 маршрут", "до 5 точек", "базовая статистика"],
			popular: false,
		},
		{
			name: "Стандарт",
			price: "4 900 ₽/мес",
			features: [
				"5 маршрутов",
				"до 30 точек",
				"игровые механики",
				"сертификаты",
			],
			popular: true,
		},
		{
			name: "Расширенный",
			price: "12 900 ₽/мес",
			features: ["Неограничено", "приоритетная поддержка", "белый лейбл"],
			popular: false,
		},
	];

	return (
		<div className="min-h-screen bg-ar-bg">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 h-16 bg-ar-bg z-50 border-b border-white/10">
				<div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-3">
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							className="text-primary"
						>
							<circle
								cx="16"
								cy="16"
								r="14"
								fill="currentColor"
								opacity="0.2"
							/>
							<path
								d="M16 6 L16 16 L22 16"
								stroke="currentColor"
								strokeWidth="2.5"
								fill="none"
								strokeLinecap="round"
							/>
							<circle cx="16" cy="16" r="2" fill="currentColor" />
						</svg>
						<span className="font-montserrat font-semibold text-white text-lg">
							Индустриальный гид
						</span>
					</Link>

					{/* Login button */}
					<Link
						to="/login"
						className="px-4 py-2 rounded-xl border border-primary text-primary font-inter font-medium hover:bg-primary hover:text-white transition-colors"
					>
						Войти
					</Link>
				</div>
			</header>

			{/* Hero */}
			<section className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
				{/* Background image */}
				<div className="absolute inset-0">
					<img
						src="/hero.jpg"
						alt=""
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-ar-bg/70" />
				</div>

				<div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
					<h1 className="font-montserrat font-bold text-4xl md:text-6xl text-white mb-6 leading-tight">
						AR-экскурсия по
						<br />
						промышленным предприятиям
					</h1>
					<p className="font-inter text-xl text-primary mb-10">
						Наведи камеру — оживи производство
					</p>

					<Link
						to="/start/1"
						className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-montserrat font-semibold text-lg hover:bg-primary-hover transition-colors"
					>
						Попробовать демо
						<ArrowRight size={20} />
					</Link>
				</div>
			</section>

			{/* Features */}
			<section className="py-20 px-4">
				<div className="max-w-6xl mx-auto">
					<h2 className="font-montserrat font-bold text-3xl text-white text-center mb-12">
						Как это работает
					</h2>

					<div className="grid md:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<div
								key={index}
								className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10"
							>
								<div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
									<feature.icon className="text-primary" size={32} />
								</div>
								<h3 className="font-montserrat font-semibold text-xl text-white mb-3">
									{feature.title}
								</h3>
								<p className="font-inter text-white/80">{feature.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="py-20 px-4 bg-white/5">
				<div className="max-w-6xl mx-auto">
					<h2 className="font-montserrat font-bold text-3xl text-white text-center mb-12">
						Тарифы
					</h2>

					<div className="grid md:grid-cols-3 gap-8">
						{pricing.map((plan, index) => (
							<div
								key={index}
								className={`
                                    rounded-2xl p-8 border-2 transition-all
                                    ${
																			plan.popular
																				? "bg-primary border-primary text-white"
																				: "bg-white border-primary/50"
																		}
                                `}
							>
								{plan.popular && (
									<span className="inline-block px-3 py-1 bg-white text-primary text-sm font-semibold rounded-full mb-4">
										Популярный
									</span>
								)}
								<h3 className={`font-montserrat font-semibold text-2xl mb-2 ${plan.popular ? "text-white" : "text-[#1A2332]"}`}>
									{plan.name}
								</h3>
								<p
									className={`font-montserrat font-bold text-3xl mb-6 ${plan.popular ? "text-white" : "text-primary"}`}
								>
									{plan.price}
								</p>
								<ul className="space-y-3 mb-8">
									{plan.features.map((feature, i) => (
										<li
											key={i}
											className={`font-inter ${plan.popular ? "text-white/90" : "text-[#1A2332]"}`}
										>
											• {feature}
										</li>
									))}
								</ul>
								<button
									onClick={() => setIsModalOpen(true)}
									className={`
                                        w-full text-center py-3 rounded-xl font-semibold transition-colors
                                        ${
																					plan.popular
																						? "bg-white text-primary hover:bg-white/90"
																						: "bg-primary text-white hover:bg-primary-hover"
																				}
                                    `}
								>
									Оставить заявку
								</button>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-12 px-4 bg-ar-bg border-t border-white/10">
				<div className="max-w-6xl mx-auto text-center">
					<div className="flex items-center justify-center gap-3 mb-4">
						<svg
							width="24"
							height="24"
							viewBox="0 0 32 32"
							className="text-primary"
						>
							<circle
								cx="16"
								cy="16"
								r="14"
								fill="currentColor"
								opacity="0.2"
							/>
							<circle cx="16" cy="16" r="2" fill="currentColor" />
						</svg>
						<span className="font-montserrat font-semibold text-white">
							Индустриальный гид
						</span>
					</div>
					<p className="font-inter text-white/70 text-sm mb-4">
						info@arguide.ru
					</p>
					<a
						href="#"
						className="font-inter text-white/70 text-sm hover:text-primary"
					>
						Политика конфиденциальности
					</a>
				</div>
			</footer>

			{/* Application Modal */}
			<ApplicationModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</div>
	);
}

export default Landing;