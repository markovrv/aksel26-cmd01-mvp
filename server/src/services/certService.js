// ============================================
// Certificate Service - генерация токенов для сертификатов
// ============================================

import { v4 as uuidv4 } from "uuid";

/**
 * Генерирует уникальный токен для сертификата
 * @returns {string} UUID v4 токен
 */
export function generateCertToken() {
	return uuidv4();
}

/**
 * Валидирует формат токена сертификата
 * @param {string} token - Токен для проверки
 * @returns {boolean} true если валидный UUID
 */
export function isValidCertToken(token) {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(token);
}
