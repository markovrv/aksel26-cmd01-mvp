// ============================================
// Image Splitter - разрезает изображение на N×N фрагментов
// ============================================

/**
 * Загружает изображение, масштабирует до targetSize × targetSize px,
 * разрезает на gridSize × gridSize квадратов и возвращает dataURL каждого фрагмента
 */
export async function splitImageIntoPieces(imageUrl, gridSize = 3, pieceSize = 60) {
	const totalSize = gridSize * pieceSize;

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			// Создаём временный canvas для масштабирования
			const scaleCanvas = document.createElement("canvas");
			scaleCanvas.width = totalSize;
			scaleCanvas.height = totalSize;
			const scaleCtx = scaleCanvas.getContext("2d");
			// Рисуем изображение, вписывая в квадрат totalSize×totalSize с сохранением пропорций
			const scale = Math.min(totalSize / img.width, totalSize / img.height);
			const offsetX = (totalSize - img.width * scale) / 2;
			const offsetY = (totalSize - img.height * scale) / 2;
			scaleCtx.fillStyle = "#0D1B2A";
			scaleCtx.fillRect(0, 0, totalSize, totalSize);
			scaleCtx.drawImage(
				img,
				offsetX,
				offsetY,
				img.width * scale,
				img.height * scale,
			);

			// Разрезаем на фрагменты
			const pieces = [];
			for (let row = 0; row < gridSize; row++) {
				for (let col = 0; col < gridSize; col++) {
					const canvas = document.createElement("canvas");
					canvas.width = pieceSize;
					canvas.height = pieceSize;
					const ctx = canvas.getContext("2d");
					ctx.drawImage(
						scaleCanvas,
						col * pieceSize,
						row * pieceSize,
						pieceSize,
						pieceSize,
						0,
						0,
						pieceSize,
						pieceSize,
					);
					pieces.push(canvas.toDataURL("image/jpeg", 0.95));
				}
			}
			resolve(pieces);
		};
		img.onerror = (err) => reject(err);
		img.src = imageUrl;
	});
}