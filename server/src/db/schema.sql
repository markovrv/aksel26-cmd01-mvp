-- ============================================
-- Структура базы данных Индустриальный гид
-- SQLite 3
-- ============================================

-- Таблица пользователей (администраторы и владельцы предприятий)
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT DEFAULT 'enterprise' CHECK(role IN ('admin', 'enterprise')),
    is_blocked  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Таблица предприятий
CREATE TABLE IF NOT EXISTS enterprises (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    industry     TEXT NOT NULL,
    city         TEXT NOT NULL,
    description  TEXT,
    logo_url     TEXT,
    owner_id     INTEGER REFERENCES users(id),
    created_at   TEXT DEFAULT (datetime('now'))
);

-- Таблица маршрутов экскурсий
CREATE TABLE IF NOT EXISTS routes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    enterprise_id  INTEGER REFERENCES enterprises(id) ON DELETE CASCADE,
    title          TEXT NOT NULL,
    description    TEXT,
    cover_url      TEXT,
    is_active      INTEGER DEFAULT 1,
    created_at     TEXT DEFAULT (datetime('now'))
);

-- Таблица точек маршрута (AR-маркеры)
CREATE TABLE IF NOT EXISTS points (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id       INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    sort_order     INTEGER DEFAULT 0,
    title          TEXT NOT NULL,
    description    TEXT,
    marker_id      TEXT NOT NULL,
    model_url      TEXT,
    audio_url      TEXT,
    animation_name TEXT DEFAULT 'idle',
    game_type      TEXT CHECK(game_type IN ('assembly', 'quiz', 'quality', 'final', 'catcher') OR game_type IS NULL),
    game_data      TEXT,
    created_at     TEXT DEFAULT (datetime('now'))
);

-- Таблица сессий посетителей
CREATE TABLE IF NOT EXISTS sessions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_name   TEXT NOT NULL,
    enterprise_id  INTEGER REFERENCES enterprises(id),
    route_id       INTEGER REFERENCES routes(id),
    started_at     TEXT DEFAULT (datetime('now')),
    completed_at   TEXT,
    cert_token     TEXT UNIQUE
);

-- Таблица посещённых точек
CREATE TABLE IF NOT EXISTS session_visits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER REFERENCES sessions(id),
    point_id    INTEGER REFERENCES points(id),
    visited_at  TEXT DEFAULT (datetime('now')),
    game_score  INTEGER DEFAULT 0,
    UNIQUE(session_id, point_id)
);

-- Таблица результатов игр
CREATE TABLE IF NOT EXISTS game_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER REFERENCES sessions(id),
    point_id    INTEGER REFERENCES points(id),
    game_type   TEXT,
    score       INTEGER,
    max_score   INTEGER,
    time_sec    INTEGER,
    played_at   TEXT DEFAULT (datetime('now'))
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_sessions_route ON sessions(route_id);
CREATE INDEX IF NOT EXISTS idx_sessions_enterprise ON sessions(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_visits_session ON session_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_visits_point ON session_visits(point_id);
CREATE INDEX IF NOT EXISTS idx_points_route ON points(route_id);
CREATE INDEX IF NOT EXISTS idx_routes_enterprise ON routes(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_game_results_session ON game_results(session_id);
