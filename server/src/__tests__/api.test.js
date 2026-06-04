// ============================================
// API Tests - тесты серверных маршрутов
// ============================================

const request = require("supertest");

// Мок модулей до импорта app
jest.mock("../db/db", () => {
	const mockDb = {
		all: jest.fn(),
		get: jest.fn(),
		run: jest.fn(),
		exec: jest.fn(),
		close: jest.fn(),
	};

	return {
		initDatabase: jest.fn().mockResolvedValue(mockDb),
		initSchema: jest.fn().mockResolvedValue(undefined),
		dbGet: jest.fn(),
		dbAll: jest.fn(),
		dbRun: jest.fn(),
		closeDatabase: jest.fn(),
		default: mockDb,
	};
});

const db = require("../db/db");

let app;

beforeAll(async () => {
	// Динамический импорт app для получения уже замоканого db
	const { default: expressApp } = await import("../app.js");
	app = expressApp;
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe("Health Check", () => {
	it("GET /health - должен возвращать статус OK", async () => {
		const res = await request(app).get("/health");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("status", "ok");
		expect(res.body).toHaveProperty("timestamp");
	});
});

describe("API Root", () => {
	it("GET /api - должен возвращать информацию об API", async () => {
		const res = await request(app).get("/api");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("name");
		expect(res.body).toHaveProperty("version");
	});
});

describe("Enterprises API", () => {
	it("GET /api/enterprises - должен возвращать список предприятий", async () => {
		const mockEnterprises = [
			{
				id: 1,
				name: "МеталлПром",
				industry: "Металлургия",
				city: "Магнитогорск",
			},
			{ id: 2, name: "ТекстильПлюс", industry: "Текстиль", city: "Иваново" },
		];

		db.dbAll.mockResolvedValue(mockEnterprises);

		const res = await request(app).get("/api/enterprises");

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.length).toBe(2);
		expect(res.body[0]).toHaveProperty("name");
	});

	it("GET /api/enterprises/:id - должен возвращать предприятие", async () => {
		const mockEnterprise = {
			id: 1,
			name: "МеталлПром",
			industry: "Металлургия",
			city: "Магнитогорск",
			description: "Крупнейший металлургический комбинат",
		};

		db.dbGet.mockResolvedValue(mockEnterprise);

		const res = await request(app).get("/api/enterprises/1");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("name", "МеталлПром");
		expect(res.body).toHaveProperty("industry", "Металлургия");
	});

	it("GET /api/enterprises/:id - должен возвращать 404 для несуществующего", async () => {
		db.dbGet.mockResolvedValue(null);

		const res = await request(app).get("/api/enterprises/999");

		expect(res.status).toBe(404);
		expect(res.body).toHaveProperty("error");
	});
});

describe("Routes API", () => {
	it("GET /api/routes/:id - должен возвращать маршрут с точками", async () => {
		const mockRoute = {
			id: 1,
			title: "Рождение металла",
			description: "Путь от руды до готового проката",
			enterprise_id: 1,
		};

		const mockPoints = [
			{ id: 1, title: "Доменная печь", description: "Плавка руды" },
			{ id: 2, title: "Прокатный стан", description: "Формовка металла" },
		];

		db.dbGet.mockResolvedValue(mockRoute);
		db.dbAll.mockResolvedValue(mockPoints);

		const res = await request(app).get("/api/routes/1");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("title", "Рождение металла");
		expect(res.body).toHaveProperty("points");
		expect(Array.isArray(res.body.points)).toBe(true);
	});
});

describe("Sessions API", () => {
	it("POST /api/session/start - должен создавать новую сессию", async () => {
		const mockEnterprise = { id: 1 };
		const mockRoute = { id: 1 };

		db.dbGet
			.mockResolvedValueOnce(mockEnterprise) // enterprise check
			.mockResolvedValueOnce(mockRoute); // route check

		db.dbRun.mockResolvedValue({ changes: 1, lastInsertRowid: 5 });

		const res = await request(app).post("/api/session/start").send({
			visitorName: "Иван Петров",
			enterpriseId: 1,
			routeId: 1,
		});

		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty("sessionId", 5);
		expect(res.body).toHaveProperty("visitorName", "Иван Петров");
	});

	it("POST /api/session/start - должен возвращать 400 без данных", async () => {
		const res = await request(app).post("/api/session/start").send({});

		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty("error");
	});

	it("GET /api/session/:id/progress - должен возвращать прогресс", async () => {
		const mockProgress = {
			visitedCount: 2,
			total: 4,
			totalScore: 50,
		};

		db.dbGet.mockResolvedValue(mockProgress);

		const res = await request(app).get("/api/session/1/progress");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("visitedCount");
		expect(res.body).toHaveProperty("total");
		expect(res.body).toHaveProperty("percent");
	});
});

describe("Games API", () => {
	it("GET /api/games/:pointId - должен возвращать данные игры", async () => {
		const mockGame = {
			id: 1,
			point_id: 1,
			game_type: "quiz",
			game_data: JSON.stringify({
				questions: [{ question: "Тест?", correctAnswer: "A" }],
			}),
		};

		db.dbGet.mockResolvedValue(mockGame);

		const res = await request(app).get("/api/games/1");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("gameType", "quiz");
		expect(res.body).toHaveProperty("gameData");
	});
});

describe("Error Handling", () => {
	it("GET /api/nonexistent - должен возвращать 404", async () => {
		const res = await request(app).get("/api/nonexistent");

		expect(res.status).toBe(404);
	});
});
