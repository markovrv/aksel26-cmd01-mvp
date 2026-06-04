// ============================================
// ProgressBar Component - индикатор прогресса
// ============================================

export function ProgressBar({
	visited = 0,
	total = 0,
	showText = true,
	variant = "default", // default, compact
}) {
	const percent = total > 0 ? Math.round((visited / total) * 100) : 0;

	const variants = {
		default: {
			container: "h-3 bg-surface-2 rounded-full overflow-hidden",
			bar: "h-full bg-primary rounded-full transition-all duration-500",
		},
		compact: {
			container: "h-2 bg-surface-2 rounded-full overflow-hidden",
			bar: "h-full bg-primary rounded-full transition-all duration-500",
		},
	};

	const styles = variants[variant];

	return (
		<div className={`${variant === "compact" ? "w-full" : "w-full max-w-xs"}`}>
			{showText && (
				<div className="flex justify-between items-center mb-1">
					<span className="font-inter text-sm text-text-muted">Прогресс</span>
					<span className="font-montserrat font-semibold text-sm text-primary">
						{visited} / {total}
					</span>
				</div>
			)}

			<div className={styles.container}>
				<div className={styles.bar} style={{ width: `${percent}%` }} />
			</div>

			{showText && (
				<div className="text-right mt-1">
					<span className="font-inter text-xs text-text-muted">
						{percent}% завершено
					</span>
				</div>
			)}
		</div>
	);
}

// Компонент для AR-тура - показывает только X/N
export function ProgressBadge({ visited = 0, total = 0 }) {
	return (
		<div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl">
			<span className="font-inter font-medium text-white">
				<span className="text-primary font-semibold">{visited}</span>
				<span className="text-white/60">/{total}</span>
			</span>
		</div>
	);
}

export default ProgressBar;
