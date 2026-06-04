// ============================================
// Certificate Component - генератор PDF сертификата
// ============================================

import { useCallback } from "react";
import jsPDF from "jspdf";

export function Certificate({
	visitorName,
	enterpriseName,
	routeTitle,
	completedAt,
	certToken,
	logoUrl,
}) {
	const generatePDF = useCallback(async () => {
		// Создаём PDF в портретной ориентации A4
		const doc = new jsPDF({
			orientation: "landscape",
			unit: "mm",
			format: "a4",
		});

		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();

		// Фон
		doc.setFillColor(13, 27, 42); // #0D1B2A
		doc.rect(0, 0, pageWidth, pageHeight, "F");

		// Декоративная рамка
		doc.setDrawColor(0, 194, 212); // #00C2D4
		doc.setLineWidth(0.5);
		doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
		doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

		// Заголовок
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(28);
		doc.setFont("helvetica", "bold");
		doc.text("СЕРТИФИКАТ", pageWidth / 2, 45, { align: "center" });

		doc.setFontSize(12);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(0, 194, 212);
		doc.text("о прохождении AR-экскурсии", pageWidth / 2, 55, {
			align: "center",
		});

		// Разделительная линия
		doc.setDrawColor(0, 194, 212);
		doc.setLineWidth(0.3);
		doc.line(pageWidth / 2 - 50, 62, pageWidth / 2 + 50, 62);

		// Текст сертификата
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(14);
		doc.text("Настоящим подтверждается, что", pageWidth / 2, 80, {
			align: "center",
		});

		// Имя посетителя
		doc.setFontSize(32);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(0, 194, 212);
		doc.text(visitorName || "Гость", pageWidth / 2, 100, { align: "center" });

		// Детали экскурсии
		doc.setFontSize(14);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(255, 255, 255);
		doc.text("успешно прошёл(ла) экскурсионный маршрут", pageWidth / 2, 120, {
			align: "center",
		});

		doc.setFontSize(20);
		doc.setFont("helvetica", "bold");
		doc.text(routeTitle || "Маршрут", pageWidth / 2, 135, { align: "center" });

		doc.setFontSize(14);
		doc.setFont("helvetica", "normal");
		doc.text(
			`на предприятии ${enterpriseName || "Промышленное предприятие"}`,
			pageWidth / 2,
			148,
			{ align: "center" },
		);

		// Дата
		const date = completedAt
			? new Date(completedAt).toLocaleDateString("ru-RU", {
					day: "numeric",
					month: "long",
					year: "numeric",
				})
			: new Date().toLocaleDateString("ru-RU");

		doc.setFontSize(12);
		doc.setTextColor(150, 150, 150);
		doc.text(`Дата: ${date}`, pageWidth / 2, 165, { align: "center" });

		// QR код placeholder (простая рамка)
		const qrSize = 25;
		const qrX = pageWidth - 50;
		const qrY = pageHeight - 50;

		doc.setDrawColor(0, 194, 212);
		doc.setLineWidth(0.3);
		doc.rect(qrX, qrY, qrSize, qrSize);

		doc.setFontSize(6);
		doc.setTextColor(100, 100, 100);
		doc.text("QR", qrX + qrSize / 2, qrY + qrSize / 2 + 1, { align: "center" });

		// Токен верификации
		doc.setFontSize(7);
		doc.setTextColor(100, 100, 100);
		doc.text(`ID: ${certToken?.slice(0, 8) || "XXXX"}`, qrX, qrY + qrSize + 5);

		// Логотип / подпись
		doc.setFontSize(10);
		doc.setTextColor(0, 194, 212);
		doc.text("Индустриальный гид", 25, pageHeight - 25);

		doc.setFontSize(8);
		doc.setTextColor(100, 100, 100);
		doc.text("arguide.ru", 25, pageHeight - 18);

		// Сохраняем PDF
		const filename = `certificate_${certToken?.slice(0, 8) || "download"}.pdf`;
		doc.save(filename);

		return filename;
	}, [visitorName, enterpriseName, routeTitle, completedAt, certToken]);

	return { generatePDF };
}

export default Certificate;
