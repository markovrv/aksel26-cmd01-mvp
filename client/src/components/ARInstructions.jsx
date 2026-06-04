// ============================================
// ARInstructions - инструкции по работе с AR
// ============================================

import { useState } from "react";
import { Camera, Download, Info, X, Smartphone } from "lucide-react";

export function ARInstructions({ isOpen, onClose, pointName = "" }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg bg-ar-card rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-ar-card p-6 border-b border-white/10 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Camera className="text-primary" size={24} />
						<h2 className="font-montserrat font-bold text-xl text-white">
							Как увидеть AR {pointName}
						</h2>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-xl hover:bg-white/10 transition-colors"
					>
						<X className="text-text-muted" size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Способ 1: QR код */}
					<div className="bg-white/5 rounded-xl p-5 border border-white/10">
						<h3 className="font-montserrat font-semibold text-lg text-white mb-3 flex items-center gap-2">
							<Smartphone className="text-primary" size={20} />
							Способ 1: QR-код
						</h3>
						<p className="font-inter text-text-muted text-sm mb-4">
							Распечатайте или покажите QR-код на экране другого устройства.
							Наведите камеру на QR-код.
						</p>

						<div className="grid grid-cols-2 gap-3">
							<div className="text-center p-3 bg-white rounded-lg">
								<div className="text-6xl mb-2">📱</div>
								<p className="text-ar-bg text-xs font-medium">
									Сканируйте камерой
								</p>
							</div>
							<div className="text-center p-3 bg-white rounded-lg">
								<div className="text-6xl mb-2">🖨️</div>
								<p className="text-ar-bg text-xs font-medium">Распечатайте</p>
							</div>
						</div>

						<a
							href="/hiro-marker.png"
							download="hiro-marker.png"
							className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-hover transition-colors"
						>
							<Download size={18} />
							Скачать HIRO маркер
						</a>
					</div>

					{/* Способ 2: Маркер */}
					<div className="bg-white/5 rounded-xl p-5 border border-white/10">
						<h3 className="font-montserrat font-semibold text-lg text-white mb-3 flex items-center gap-2">
							<Info className="text-primary" size={20} />
							Способ 2: Распечатанный маркер
						</h3>
						<p className="font-inter text-text-muted text-sm mb-4">
							Распечатайте этот маркер на листе A4 для лучшего распознавания. AR
							модель появится над маркером.
						</p>

						<div className="bg-white p-4 rounded-xl text-center">
							<p className="text-xs text-gray-500 mb-2">
								HIRO Marker (распечатайте в цвете)
							</p>
							<div className="inline-block p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg">
								<div className="grid grid-cols-8 gap-0 w-32 h-32">
									{/* HIRO pattern visualization */}
									{[...Array(64)].map((_, i) => {
										const row = Math.floor(i / 8);
										const col = i % 8;
										const isBorder =
											row === 0 || row === 7 || col === 0 || col === 7;
										const isInner =
											row === 1 || row === 6 || col === 1 || col === 7;
										const isCorner =
											(row === 2 && col === 2) ||
											(row === 2 && col === 5) ||
											(row === 5 && col === 2) ||
											(row === 5 && col === 5);
										const isMiddle =
											row >= 3 && row <= 4 && col >= 3 && col <= 4;
										const bg = isBorder
											? "#000"
											: isInner
												? "#fff"
												: isCorner
													? "#000"
													: isMiddle
														? "#000"
														: "#fff";
										return (
											<div
												key={i}
												className="w-4 h-4"
												style={{ backgroundColor: bg }}
											/>
										);
									})}
								</div>
							</div>
						</div>
					</div>

					{/* Советы */}
					<div className="bg-primary/10 rounded-xl p-5 border border-primary/30">
						<h3 className="font-montserrat font-semibold text-lg text-primary mb-3">
							💡 Советы для лучшего результата
						</h3>
						<ul className="space-y-2 text-sm text-text-muted">
							<li>• Хорошее освещение — избегайте теней на маркере</li>
							<li>• Держите камеру на расстоянии 30-50 см от маркера</li>
							<li>• Не двигайте маркер слишком быстро</li>
							<li>• Для тестирования используйте второй экран с маркером</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ARInstructions;
