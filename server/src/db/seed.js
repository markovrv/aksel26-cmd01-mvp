// ============================================
// Seed-скрипт для демо-данных
// Создаёт 2 предприятия, маршруты, точки и пользователей
// ============================================

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, dbRun, dbGet, dbAll, initSchema, closeDatabase } from './db.js';

// Константы
const SALT_ROUNDS = 12;
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || 'ARGUIDE-ADMIN-2026';

/**
 * Демо-данные: предприятия
 */
const enterprises = [
    {
        name: 'ООО «МеталлПром»',
        industry: 'Металлургия',
        city: 'Магнитогорск',
        description: 'Крупнейший металлургический комбинат России, производящий сталь и прокат.',
        logo_url: '/uploads/logos/metallprom.png'
    },
    {
        name: 'АО «ТекстильПлюс»',
        industry: 'Текстильная промышленность',
        city: 'Иваново',
        description: 'Современное текстильное предприятие полного цикла производства.',
        logo_url: '/uploads/logos/tekstilplus.png'
    }
];

/**
 * Демо-данные: маршруты
 */
const routes = [
    {
        enterprise_id: 1,
        title: 'Рождение металла',
        description: 'Путь от руды до готового проката — доменная печь, прокатный стан и контроль качества.',
        cover_url: '/uploads/covers/route-metal.jpg'
    },
    {
        enterprise_id: 2,
        title: 'Путь нити',
        description: 'От ткацкого станка до готового полотна — путь текстильного производства.',
        cover_url: '/uploads/covers/route-textile.jpg'
    }
];

/**
 * Демо-данные: точки маршрута «Рождение металла»
 */
const metalPoints = [
    {
        route_id: 1,
        sort_order: 1,
        title: 'Доменная печь',
        description: 'Главное плавильное устройство комбината. Здесь при температуре до 1500°C железная руда превращается в жидкий чугун. Процесс плавки непрерывен — доменная печь работает круглосуточно более 50 лет без остановки на ремонт.',
        marker_id: 'marker-mp-001',
        model_url: '/uploads/models/furnace.glb',
        audio_url: '/uploads/audio/furnace.mp3',
        animation_name: 'idle',
        game_type: 'quiz',
        game_data: JSON.stringify({
            questions: [
                {
                    id: 1,
                    text: 'При какой температуре работает доменная печь?',
                    options: ['800°C', '1200°C', '1500°C', '2000°C'],
                    correct: 2,
                    explanation: 'Температура в горне доменной печи достигает 1500°C — при этом чугун переходит в жидкое состояние.'
                },
                {
                    id: 2,
                    text: 'Что является основным сырьём для выплавки чугуна?',
                    options: ['Медная руда', 'Железная руда', 'Бокситы', 'Каолин'],
                    correct: 1,
                    explanation: 'Железная руда (гематит или магнетит) — основное сырьё доменного процесса.'
                },
                {
                    id: 3,
                    text: 'Как называется побочный продукт доменного производства?',
                    options: ['Шлак', 'Кокс', 'Агломерат', 'Флюс'],
                    correct: 0,
                    explanation: 'Шлак — силикатный расплав, образующийся при выплавке. Используется в строительстве.'
                }
            ],
            timePerQuestion: 20,
            pointsPerCorrect: 30
        })
    },
    {
        route_id: 1,
        sort_order: 2,
        title: 'Прокатный стан',
        description: 'Здесь раскалённый металл превращается в листы, балки и профильные изделия. Прокатный стан — сердце завода, производящее тысячи тонн металлопроката ежедневно.',
        marker_id: 'marker-mp-002',
        model_url: '/uploads/models/rolling_mill.glb',
        audio_url: '/uploads/audio/rolling.mp3',
        animation_name: 'idle',
        game_type: 'assembly',
        game_data: JSON.stringify({
            parts: [
                { id: 'roller', modelUrl: '/uploads/models/roller.glb', correctPosition: { x: 0, y: 0.05, z: 0 }, label: 'Прокатный валок' },
                { id: 'frame', modelUrl: '/uploads/models/frame.glb', correctPosition: { x: 0.3, y: 0, z: 0 }, label: 'Несущая рама' },
                { id: 'drive', modelUrl: '/uploads/models/drive.glb', correctPosition: { x: -0.2, y: 0, z: 0.1 }, label: 'Привод' }
            ],
            timeLimit: 60,
            tolerancePx: 40
        })
    },
    {
        route_id: 1,
        sort_order: 3,
        title: 'ОТК-стенд',
        description: 'Отдел технического контроля — гарантия качества каждого изделия. Здесь металлопрокат проходит проверку на прочность, геометрию и отсутствие дефектов.',
        marker_id: 'marker-mp-003',
        model_url: '/uploads/models/qc_station.glb',
        audio_url: null,
        animation_name: 'idle',
        game_type: 'quality',
        game_data: JSON.stringify({
            timeLimit: 45,
            rounds: 5
        })
    },
    {
        route_id: 1,
        sort_order: 4,
        title: 'Финальный стенд',
        description: 'Завершающий этап производства — упаковка и отгрузка готовой продукции. Каждый день тысячи тонн металлопроката отправляются по всей России и за рубеж.',
        marker_id: 'marker-mp-004',
        model_url: '/uploads/models/final_station.glb',
        audio_url: null,
        animation_name: 'idle',
        game_type: 'catcher',
        game_data: JSON.stringify({
            timeLimit: 45,
            goodParts: ["⚙️", "🔩", "🔧", "🏗️"],
            badParts:  ["💣", "🗑️", "❌"],
            goodScore: 10,
            badPenalty: 15,
            spawnInterval: 1200,
            fallSpeed: 2
        })
    }
];

/**
 * Демо-данные: точки маршрута «Путь нити»
 */
const textilePoints = [
    {
        route_id: 2,
        sort_order: 1,
        title: 'Ткацкий станок',
        description: 'Классический ткацкий станок создаёт полотно из продольных и поперечных нитей. Современные станки работают со скоростью до 1000 оборотов в минуту.',
        marker_id: 'marker-tp-001',
        model_url: '/uploads/models/loom.glb',
        audio_url: '/uploads/audio/loom.mp3',
        animation_name: 'idle',
        game_type: 'assembly',
        game_data: JSON.stringify({
            parts: [
                { id: 'shuttle', modelUrl: '/uploads/models/shuttle.glb', correctPosition: { x: 0, y: 0.05, z: 0 }, label: 'Челнок' },
                { id: 'heddles', modelUrl: '/uploads/models/heddles.glb', correctPosition: { x: 0.2, y: 0, z: 0 }, label: 'Ремизки' },
                { id: 'reed', modelUrl: '/uploads/models/reed.glb', correctPosition: { x: -0.2, y: 0, z: 0 }, label: 'Бердо' }
            ],
            timeLimit: 60,
            tolerancePx: 40
        })
    },
    {
        route_id: 2,
        sort_order: 2,
        title: 'Покраска ткани',
        description: 'Промышленная покраска позволяет получить любой цвет и оттенок. Красители наносятся под давлением и фиксируются при высокой температуре.',
        marker_id: 'marker-tp-002',
        model_url: '/uploads/models/dyeing.glb',
        audio_url: '/uploads/audio/dyeing.mp3',
        animation_name: 'idle',
        game_type: 'quiz',
        game_data: JSON.stringify({
            questions: [
                {
                    id: 1,
                    text: 'Какой тип красителя используется для хлопка?',
                    options: ['Кислотные', 'Прямые', 'Дисперсные', 'Основные'],
                    correct: 1,
                    explanation: 'Прямые красители образуют водородные связи с целлюлозой хлопка.'
                },
                {
                    id: 2,
                    text: 'При какой температуре фиксируется краситель на хлопке?',
                    options: ['80°C', '102°C', '130°C', '180°C'],
                    correct: 2,
                    explanation: 'Температура 130°C — оптимальная для термозакрепления прямых красителей.'
                },
                {
                    id: 3,
                    text: 'Что такое мерсеризация ткани?',
                    options: ['Отбеливание', 'Обработка щёлочью для блеска', 'Умягчение', 'Антистатическая обработка'],
                    correct: 1,
                    explanation: 'Мерсеризация — обработка концентрированной щёлочью для придания блеска и прочности.'
                }
            ],
            timePerQuestion: 20,
            pointsPerCorrect: 30
        })
    },
    {
        route_id: 2,
        sort_order: 3,
        title: 'Упаковочная линия',
        description: 'Готовая ткань нарезается, складывается и упаковывается для отправки. Каждый рулон проходит контроль качества и получает этикетку с характеристиками.',
        marker_id: 'marker-tp-003',
        model_url: '/uploads/models/packing.glb',
        audio_url: null,
        animation_name: 'idle',
        game_type: null,
        game_data: null
    }
];

/**
 * Создание демо-пользователей
 */
const users = [
    {
        name: 'Администратор',
        email: 'admin@arguide.ru',
        password: 'Admin123!',
        role: 'admin'
    },
    {
        name: 'Иван Петров',
        email: 'metall@arguide.ru',
        password: 'Metall456!',
        role: 'enterprise',
        enterprise_id: 1
    },
    {
        name: 'Мария Сидорова',
        email: 'textile@arguide.ru',
        password: 'Textile789!',
        role: 'enterprise',
        enterprise_id: 2
    }
];

/**
 * Основная функция seed
 */
async function seed() {
    try {
        console.log('[SEED] Начинаю загрузку демо-данных...');
        
        // Инициализируем БД
        await initDatabase();
        await initSchema();
        
        // Проверяем, есть ли уже данные
        const existingUsers = await dbGet('SELECT COUNT(*) as count FROM users');
        if (existingUsers.count > 0) {
            console.log('[SEED] Данные уже существуют. Пропускаю.');
            closeDatabase();
            return;
        }
        
        // Создаём предприятия
        console.log('[SEED] Создаю предприятия...');
        const enterpriseIds = [];
        for (const enterprise of enterprises) {
            const result = await dbRun(
                'INSERT INTO enterprises (name, industry, city, description, logo_url) VALUES (?, ?, ?, ?, ?)',
                [enterprise.name, enterprise.industry, enterprise.city, enterprise.description, enterprise.logo_url]
            );
            enterpriseIds.push(result.lastInsertRowid);
            console.log(`[SEED] Создано предприятие: ${enterprise.name} (ID: ${result.lastInsertRowid})`);
        }
        
        // Создаём маршруты
        console.log('[SEED] Создаю маршруты...');
        const routeIds = [];
        for (const route of routes) {
            const result = await dbRun(
                'INSERT INTO routes (enterprise_id, title, description, cover_url) VALUES (?, ?, ?, ?)',
                [route.enterprise_id, route.title, route.description, route.cover_url]
            );
            routeIds.push(result.lastInsertRowid);
            console.log(`[SEED] Создан маршрут: ${route.title} (ID: ${result.lastInsertRowid})`);
        }
        
        // Создаём точки для металлургического маршрута
        console.log('[SEED] Создаю точки маршрута «Рождение металла»...');
        for (const point of metalPoints) {
            await dbRun(
                `INSERT INTO points (route_id, sort_order, title, description, marker_id, model_url, audio_url, animation_name, game_type, game_data) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [point.route_id, point.sort_order, point.title, point.description, point.marker_id, point.model_url, point.audio_url, point.animation_name, point.game_type, point.game_data]
            );
            console.log(`[SEED] Создана точка: ${point.title}`);
        }
        
        // Создаём точки для текстильного маршрута
        console.log('[SEED] Создаю точки маршрута «Путь нити»...');
        for (const point of textilePoints) {
            await dbRun(
                `INSERT INTO points (route_id, sort_order, title, description, marker_id, model_url, audio_url, animation_name, game_type, game_data) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [point.route_id, point.sort_order, point.title, point.description, point.marker_id, point.model_url, point.audio_url, point.animation_name, point.game_type, point.game_data]
            );
            console.log(`[SEED] Создана точка: ${point.title}`);
        }
        
        // Создаём пользователей
        console.log('[SEED] Создаю пользователей...');
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
            await dbRun(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [user.name, user.email, hashedPassword, user.role]
            );
            console.log(`[SEED] Создан пользователь: ${user.email} (${user.role})`);
        }
        
        console.log('[SEED] Демо-данные загружены успешно!');
        console.log('');
        console.log('========================================');
        console.log('Демо-учётные данные:');
        console.log('========================================');
        console.log('Администратор: admin@arguide.ru / Admin123!');
        console.log('МеталлПром:    metall@arguide.ru / Metall456!');
        console.log('ТекстильПлюс:  textile@arguide.ru / Textile789!');
        console.log('========================================');
        
        closeDatabase();
    } catch (error) {
        console.error('[SEED] Ошибка загрузки демо-данных:', error);
        process.exit(1);
    }
}

// Запуск seed
seed();
