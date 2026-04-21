import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { run } from './database.js';

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const seedTestData = async () => {
  try {
    console.log('Starting test data insertion...');

    // Create test admin
    const adminId = uuidv4();
    const adminPassword = await hashPassword('admin123');
    await run(
      'INSERT INTO admins (id, email, password, name) VALUES (?, ?, ?, ?)',
      [adminId, 'admin@platform.ru', adminPassword, 'Администратор']
    );
    console.log('✓ Created admin account');

    // Create test students
    const studentIds = [];
    const studentData = [
      { full_name: 'Иван Петров', university: 'КГУ', course: 2, city: 'Киров', email: 'ivan@student.ru' },
      { full_name: 'Мария Сидорова', university: 'ВГУ', course: 3, city: 'Киров', email: 'maria@student.ru' },
      { full_name: 'Алексей Иванов', university: 'ПГУ', course: 1, city: 'Киров', email: 'alex@student.ru' },
      { full_name: 'Елена Смирнова', university: 'КГУ', course: 4, city: 'Киров', email: 'elena@student.ru' },
      { full_name: 'Дмитрий Морозов', university: 'СГТУ', course: 2, city: 'Киров', email: 'dmitry@student.ru' },
    ];

    for (const student of studentData) {
      const studentId = uuidv4();
      const hashedPassword = await hashPassword('password123');
      await run(
        'INSERT INTO students (id, email, password, full_name, university, course, city, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [studentId, student.email, hashedPassword, student.full_name, student.university, student.course, student.city, '+7-900-000-00-00']
      );
      studentIds.push(studentId);
    }
    console.log(`✓ Created ${studentIds.length} test students`);

    // Create test companies
    const companyIds = [];
    const companyData = [
      {
        name: 'Кировский машиностроительный завод',
        inn: '4341018148',
        city: 'Киров',
        website: 'https://kmz.ru',
        contact_person: 'Сергей Орлов',
        phone: '+7-8332-00-00-00',
        description: 'Один из крупнейших производителей промышленного оборудования в России.',
        email: 'hr@kmz.ru'
      },
      {
        name: 'АО Слюдяные заводы',
        inn: '4341025463',
        city: 'Киров',
        website: 'https://sluda.ru',
        contact_person: 'Наталья Волкова',
        phone: '+7-8332-11-11-11',
        description: 'Производитель слюдопласта и электроизоляционных материалов.',
        email: 'recruitment@sluda.ru'
      },
      {
        name: 'Кировский завод "Электроаппарат"',
        inn: '4341035789',
        city: 'Киров',
        website: 'https://electro-app.ru',
        contact_person: 'Виктор Соколов',
        phone: '+7-8332-22-22-22',
        description: 'Производство электрооборудования и автоматических систем управления.',
        email: 'jobs@electro-app.ru'
      },
      {
        name: 'ООО Кировский лесоперерабатывающий комплекс',
        inn: '4341054321',
        city: 'Киров',
        website: 'https://klpk.ru',
        contact_person: 'Раиса Петрова',
        phone: '+7-8332-33-33-33',
        description: 'Комплекс по переработке древесины и производству деревянных конструкций.',
        email: 'hr@klpk.ru'
      },
      {
        name: 'ПАО Вятское производственное объединение',
        inn: '4341087654',
        city: 'Киров',
        website: 'https://vpo.ru',
        contact_person: 'Олег Козлов',
        phone: '+7-8332-44-44-44',
        description: 'Крупное промышленное предприятие с полным циклом производства.',
        email: 'career@vpo.ru'
      },
    ];

    for (const company of companyData) {
      const companyId = uuidv4();
      const hashedPassword = await hashPassword('company123');
      await run(
        'INSERT INTO companies (id, email, password, name, inn, city, website, contact_person, phone, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [companyId, company.email, hashedPassword, company.name, company.inn, company.city, company.website, company.contact_person, company.phone, company.description, 'active']
      );
      companyIds.push(companyId);
    }
    console.log(`✓ Created ${companyIds.length} test companies`);

    // Create test events
    const eventIds = [];
    const eventData = [
      {
        company_id: companyIds[0],
        type: 'case',
        title: 'Оптимизация производственного процесса',
        description: 'Требуется разработать решение для оптимизации производственного процесса сборки оборудования. Текущая производительность 100 единиц в день, целевой показатель 150 единиц.',
        requirements: '- Знание процессов производства\n- Навыки аналитики\n- Умение работать с данными',
        application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        format: 'online'
      },
      {
        company_id: companyIds[0],
        type: 'internship',
        title: 'Стажировка "Инженер по качеству"',
        description: 'Приглашаем студентов на стажировку в отдел контроля качества. Вы будете работать с современным оборудованием и применять теоретические знания на практике.',
        requirements: '- Знание основ стандартизации\n- Внимание к деталям\n- Ответственность',
        application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        event_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        format: 'offline',
        max_participants: 10
      },
      {
        company_id: companyIds[0],
        type: 'tour',
        title: 'Экскурсия на производство',
        description: 'Познакомьтесь с процессом производства и увидьте, как работает современный промышленный комплекс. Экскурсия включает посещение всех ключевых отделов.',
        requirements: 'Удобная одежда и обувь, готовность к физической активности',
        application_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        event_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        event_time: '10:00',
        format: 'offline',
        max_participants: 30
      },
      {
        company_id: companyIds[1],
        type: 'case',
        title: 'Разработка системы учета материалов',
        description: 'Необходимо разработать систему автоматизированного учета материалов на складе. Система должна учитывать входящие и исходящие потоки, генерировать отчеты.',
        requirements: '- Опыт программирования\n- Знание баз данных\n- Логическое мышление',
        application_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        format: 'online'
      },
      {
        company_id: companyIds[2],
        type: 'internship',
        title: 'Стажировка "Программист-разработчик"',
        description: 'Присоединяйтесь к команде разработчиков и создавайте системы управления электрооборудованием. Отличная возможность применить и развить свои навыки.',
        requirements: '- Основы программирования\n- Знание C/C++ приветствуется\n- Пунктуальность и ответственность',
        application_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        event_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        format: 'offline',
        max_participants: 8
      },
      {
        company_id: companyIds[3],
        type: 'tour',
        title: 'Виртуальная экскурсия по лесопереработке',
        description: 'Узнайте о процессе переработки древесины от заготовки до готового изделия. Виртуальная экскурсия позволит увидеть все этапы производства.',
        requirements: 'Компьютер с интернетом',
        application_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        event_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        event_time: '14:00',
        format: 'online',
        max_participants: 50
      },
    ];

    for (const event of eventData) {
      const eventId = uuidv4();
      await run(
        `INSERT INTO events (id, company_id, type, title, description, requirements, application_deadline, event_date, event_time, format, max_participants, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, event.company_id, event.type, event.title, event.description, event.requirements, event.application_deadline, event.event_date || null, event.event_time || null, event.format, event.max_participants || null, 'active']
      );
      eventIds.push(eventId);
    }
    console.log(`✓ Created ${eventIds.length} test events`);

    // Create test applications
    const applications = [
      { event_id: eventIds[0], student_id: studentIds[0], text_content: 'Я готов помочь оптимизировать процесс. У меня есть опыт работы с процессами и анализом данных.' },
      { event_id: eventIds[0], student_id: studentIds[1], text_content: 'Интересное задание! Я изучал оптимизацию на курсах и готов применить знания на практике.' },
      { event_id: eventIds[1], student_id: studentIds[0], text_content: 'Хочу пройти стажировку в отделе качества, интересуюсь этой сферой.' },
      { event_id: eventIds[1], student_id: studentIds[2], text_content: 'Я хочу больше узнать о контроле качества и готов к обучению.' },
      { event_id: eventIds[2], student_id: studentIds[1], text_content: 'С удовольствием приду на экскурсию, хочу увидеть настоящее производство.' },
      { event_id: eventIds[2], student_id: studentIds[3], text_content: 'Зарегистрирован для экскурсии.' },
      { event_id: eventIds[3], student_id: studentIds[2], text_content: 'Я программист и интересуюсь разработкой систем учета. Готов взяться за эту задачу.' },
      { event_id: eventIds[4], student_id: studentIds[4], text_content: 'Ищу стажировку в компании с хорошей репутацией. Ваша компания нас привлекает.' },
      { event_id: eventIds[4], student_id: studentIds[0], text_content: 'Готов пройти стажировку и научиться новому.' },
      { event_id: eventIds[5], student_id: studentIds[3], text_content: 'Интересуюсь производством и переработкой древесины.' },
    ];

    for (const app of applications) {
      const applicationId = uuidv4();
      await run(
        'INSERT INTO applications (id, event_id, student_id, text_content, status) VALUES (?, ?, ?, ?, ?)',
        [applicationId, app.event_id, app.student_id, app.text_content, 'new']
      );
    }
    console.log(`✓ Created ${applications.length} test applications`);

    console.log('\n✅ Test data successfully inserted!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@platform.ru / admin123');
    console.log('Student: ivan@student.ru / password123');
    console.log('Company: hr@kmz.ru / company123');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};
