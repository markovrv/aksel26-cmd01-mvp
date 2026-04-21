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
    const adminUserId = uuidv4();
    const adminPassword = await hashPassword('admin123');
    await run(
      'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
      [adminUserId, 'admin@platform.ru', adminPassword, 'admin']
    );
    await run(
      'INSERT INTO admin_profiles (id, user_id, name) VALUES (?, ?, ?)',
      [uuidv4(), adminUserId, 'Администратор']
    );
    console.log('✓ Created admin account');

    // Create test students
    const studentIds = [];
    const studentData = [
      { first_name: 'Иван', last_name: 'Петров', university: 'КГУ', course: 2, specialization: 'Информатика', city: 'Киров', email: 'ivan@student.ru' },
      { first_name: 'Мария', last_name: 'Сидорова', university: 'ВГУ', course: 3, specialization: 'Менеджмент', city: 'Киров', email: 'maria@student.ru' },
      { first_name: 'Алексей', last_name: 'Иванов', university: 'ПГУ', course: 1, specialization: 'Экономика', city: 'Киров', email: 'alex@student.ru' },
      { first_name: 'Елена', last_name: 'Смирнова', university: 'КГУ', course: 4, specialization: 'Инженерия', city: 'Киров', email: 'elena@student.ru' },
      { first_name: 'Дмитрий', last_name: 'Морозов', university: 'СГТУ', course: 2, specialization: 'Машиностроение', city: 'Киров', email: 'dmitry@student.ru' },
    ];

    for (const student of studentData) {
      const userId = uuidv4();
      const hashedPassword = await hashPassword('password123');
      await run(
        'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
        [userId, student.email, hashedPassword, 'student']
      );
      await run(
        'INSERT INTO student_profiles (id, user_id, first_name, last_name, university, course, specialization, city, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), userId, student.first_name, student.last_name, student.university, student.course, student.specialization, student.city, '+7-900-000-00-00']
      );
      studentIds.push(userId);
    }
    console.log(`✓ Created ${studentIds.length} test students`);

    // Create test companies
    const companyIds = [];
    const companyData = [
      {
        name: 'Кировский машиностроительный завод',
        short_description: 'Один из крупнейших производителей промышленного оборудования в России.',
        full_description: 'Кировский машиностроительный завод - один из крупнейших производителей промышленного оборудования в России. Завод специализируется на производстве тяжелого машиностроительного оборудования, включая металлорежущие станки, прессы и автоматизированные производственные линии.',
        city: 'Киров',
        address: 'ул. Ленина, 1',
        latitude: 58.596,
        longitude: 49.6199,
        contact_person: 'Сергей Орлов',
        contact_phone: '+7-8332-00-00-00',
        contact_email: 'hr@kmz.ru',
        email: 'hr@kmz.ru'
      },
      {
        name: 'АО Слюдяные заводы',
        short_description: 'Производитель слюдопласта и электроизоляционных материалов.',
        full_description: 'АО "Слюдяные заводы" - ведущий производитель слюдопласта и электроизоляционных материалов в Кировской области. Предприятие выпускает продукцию для электротехнической промышленности, включая слюдяные материалы, электроизоляционные ленты и компаунды.',
        city: 'Киров',
        address: 'ул. Московская, 15',
        latitude: 58.610,
        longitude: 49.630,
        contact_person: 'Наталья Волкова',
        contact_phone: '+7-8332-11-11-11',
        contact_email: 'recruitment@sluda.ru',
        email: 'recruitment@sluda.ru'
      },
    ];

    for (const company of companyData) {
      console.log('Processing company:', company.name);
      console.log('Latitude:', company.latitude, 'type:', typeof company.latitude);
      console.log('Longitude:', company.longitude, 'type:', typeof company.longitude);
      const userId = uuidv4();
      const hashedPassword = await hashPassword('company123');
      await run(
        'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
        [userId, company.email, hashedPassword, 'company']
      );
      const profileId = uuidv4();
      await run(
        'INSERT INTO company_profiles (id, user_id, name, short_description, full_description, city, address, contact_person, contact_phone, contact_email, moderation_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [profileId, userId, company.name, company.short_description, company.full_description, company.city, company.address, company.contact_person, company.contact_phone, company.contact_email, 'active']
      );

      // Set coordinates separately
      if (company.latitude && company.longitude) {
        await run(
          'UPDATE company_profiles SET latitude = ?, longitude = ? WHERE id = ?',
          [company.latitude, company.longitude, profileId]
        );
      }

      companyIds.push(userId);
    }
    console.log(`✓ Created ${companyIds.length} test companies`);

    // Create test cases
    const caseIds = [];
    const caseData = [
      {
        company_id: companyIds[0],
        title: 'Оптимизация производственного процесса',
        description: 'Требуется разработать решение для оптимизации производственного процесса сборки оборудования. Текущая производительность 100 единиц в день, целевой показатель 150 единиц. Необходимо проанализировать существующие процессы, выявить узкие места и предложить меры по повышению эффективности.',
        requirements: '- Знание процессов производства\n- Навыки аналитики\n- Умение работать с данными\n- Знание методов оптимизации',
        application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        company_id: companyIds[0],
        title: 'Разработка системы учета производственных потерь',
        description: 'Необходимо разработать систему для учета и анализа производственных потерь. Система должна собирать данные о браке, простоях оборудования, материальных потерях и предоставлять аналитику для принятия управленческих решений.',
        requirements: '- Знание баз данных\n- Опыт разработки ПО\n- Понимание производственных процессов\n- Умение работать с большими данными',
        application_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        company_id: companyIds[1],
        title: 'Автоматизация контроля качества продукции',
        description: 'Требуется разработать систему автоматизированного контроля качества для производства слюдопласта. Система должна интегрироваться с существующим оборудованием и предоставлять отчеты о качестве в реальном времени.',
        requirements: '- Знание программирования\n- Опыт работы с промышленным оборудованием\n- Знание стандартов качества\n- Умение работать с датчиками и автоматикой',
        application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const caseItem of caseData) {
      const caseId = uuidv4();
      await run(
        `INSERT INTO cases (id, company_id, title, description, requirements, application_deadline, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [caseId, caseItem.company_id, caseItem.title, caseItem.description, caseItem.requirements, caseItem.application_deadline, 'active']
      );
      caseIds.push(caseId);
    }
    console.log(`✓ Created ${caseIds.length} test cases`);

    // Create test solutions
    const solutions = [
      { case_id: caseIds[0], student_id: studentIds[0], text_content: 'Я готов помочь оптимизировать процесс. У меня есть опыт работы с процессами и анализом данных. Предлагаю использовать методы бережливого производства.' },
      { case_id: caseIds[0], student_id: studentIds[1], text_content: 'Интересное задание! Я изучал оптимизацию на курсах и готов применить знания на практике. Можно использовать статистические методы контроля.' },
      { case_id: caseIds[1], student_id: studentIds[2], text_content: 'Я студент экономического факультета и интересуюсь вопросами эффективности производства. Готов разработать систему учета потерь.' },
      { case_id: caseIds[2], student_id: studentIds[3], text_content: 'Как инженер, я понимаю важность контроля качества. У меня есть опыт работы с автоматизированными системами контроля.' },
    ];

    for (const solution of solutions) {
      const solutionId = uuidv4();
      await run(
        'INSERT INTO solutions (id, case_id, student_id, text_content, status) VALUES (?, ?, ?, ?, ?)',
        [solutionId, solution.case_id, solution.student_id, solution.text_content, 'new']
      );
    }
    console.log(`✓ Created ${solutions.length} test solutions`);

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
