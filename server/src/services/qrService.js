// ============================================
// QR Service - генерация данных для QR-кодов
// ============================================

/**
 * Генерирует URL для верификации сертификата
 * @param {string} certToken - Токен сертификата
 * @param {string} baseUrl - Базовый URL приложения
 * @returns {string} Полный URL для QR-кода
 */
export function generateCertVerifyUrl(certToken, baseUrl = "") {
	return `${baseUrl}/verify/${certToken}`;
}

/**
 * Парсит URL верификации и извлекает токен
 * @param {string} url - URL для парсинга
 * @returns {string|null} Токен или null
 */
export function extractCertTokenFromUrl(url) {
	const match = url.match(/\/verify\/([0-9a-f-]{36})/i);
	return match ? match[1] : null;
}
