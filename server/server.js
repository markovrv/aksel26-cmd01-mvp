import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, run, get, all } from './database.js';
import {
  hashPassword,
  comparePasswords,
  generateToken,
  authenticate,
  authorize,
  createSession,
  invalidateSession,
} from './auth.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Initialize database
await initializeDatabase();

// ============= HELPER FUNCTIONS =============

const logAction = async (userId, userType, action, entityType = null, entityId = null, details = null) => {
  await run(
    'INSERT INTO logs (id, user_id, user_type, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uuidv4(), userId, userType, action, entityType, entityId, JSON.stringify(details)]
  );
};

// ============= STUDENT AUTH ROUTES =============

app.post('/api/auth/student/register', async (req, res) => {
  try {
    const { email, password, full_name, university, course, city, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const existing = await get('SELECT id FROM students WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const studentId = uuidv4();
    const hashedPassword = await hashPassword(password);

    await run(
      'INSERT INTO students (id, email, password, full_name, university, course, city, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [studentId, email, hashedPassword, full_name, university, course, city, phone]
    );

    const token = generateToken(studentId);
    await createSession(studentId, 'student', token);
    await logAction(studentId, 'student', 'register');

    const student = await get('SELECT id, email, full_name, university, course, city FROM students WHERE id = ?', [studentId]);
    res.status(201).json({ student, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const student = await get('SELECT * FROM students WHERE email = ?', [email]);
    if (!student) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const passwordMatch = await comparePasswords(password, student.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const token = generateToken(student.id);
    await createSession(student.id, 'student', token);
    await logAction(student.id, 'student', 'login');

    const { password: _, ...studentWithoutPassword } = student;
    res.json({ student: studentWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN AUTH ROUTES =============

app.post('/api/auth/admin/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const existing = await get('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const adminId = uuidv4();
    const hashedPassword = await hashPassword(password);

    await run(
      'INSERT INTO admins (id, email, password, name) VALUES (?, ?, ?, ?)',
      [adminId, email, hashedPassword, name]
    );

    const token = generateToken(adminId);
    await createSession(adminId, 'admin', token);
    await logAction(adminId, 'admin', 'register');

    const admin = await get('SELECT id, email, name FROM admins WHERE id = ?', [adminId]);
    res.status(201).json({ admin, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= COMPANY AUTH ROUTES =============

app.post('/api/auth/company/register', async (req, res) => {
  try {
    const { email, password, name, inn, city, website, contact_person, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const existing = await get('SELECT id FROM companies WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const companyId = uuidv4();
    const hashedPassword = await hashPassword(password);

    await run(
      'INSERT INTO companies (id, email, password, name, inn, city, website, contact_person, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [companyId, email, hashedPassword, name, inn, city, website, contact_person, phone, 'pending']
    );

    const token = generateToken(companyId);
    await createSession(companyId, 'company', token);
    await logAction(companyId, 'company', 'register');

    const company = await get('SELECT id, email, name, city, status FROM companies WHERE id = ?', [companyId]);
    res.status(201).json({ company, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/company/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const company = await get('SELECT * FROM companies WHERE email = ?', [email]);
    if (!company) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const passwordMatch = await comparePasswords(password, company.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const token = generateToken(company.id);
    await createSession(company.id, 'company', token);
    await logAction(company.id, 'company', 'login');

    const { password: _, ...companyWithoutPassword } = company;
    res.json({ company: companyWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= COMMON AUTH ROUTES =============

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await invalidateSession(token);
    }
    res.json({ message: 'Вы вышли из системы' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userType = req.headers['x-user-type'];

    if (!token || !userType) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let user;
    if (userType === 'student') {
      user = await get('SELECT id, email, full_name, university, course, city FROM students WHERE id = (SELECT user_id FROM sessions WHERE token = ?)', [token]);
    } else if (userType === 'company') {
      user = await get('SELECT id, email, name, city, status FROM companies WHERE id = (SELECT user_id FROM sessions WHERE token = ?)', [token]);
    } else if (userType === 'admin') {
      user = await get('SELECT id, email, name FROM admins WHERE id = (SELECT user_id FROM sessions WHERE token = ?)', [token]);
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user, userType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= EVENTS (МЕРОПРИЯТИЯ) =============

// Get all active events
app.get('/api/events', async (req, res) => {
  try {
    const type = req.query.type;
    const city = req.query.city;
    const search = req.query.search;

    let query = `
      SELECT e.*, c.name as company_name, c.city as company_city
      FROM events e
      JOIN companies c ON e.company_id = c.id
      WHERE e.status = 'active' AND c.status = 'active'
    `;
    const params = [];

    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }

    if (city) {
      query += ' AND c.city = ?';
      params.push(city);
    }

    if (search) {
      query += ' AND (e.title LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.created_at DESC';

    const events = await all(query, params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event detail
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await get(
      `SELECT e.*, c.name as company_name, c.description as company_description, c.city
       FROM events e
       JOIN companies c ON e.company_id = c.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }

    // Increment view count
    await run('UPDATE events SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event (company only)
app.post('/api/events', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { type, title, description, requirements, application_deadline, event_date, event_time, format, max_participants, file } = req.body;

    if (!token || !type || !title || !application_deadline) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const company = await get('SELECT status FROM companies WHERE id = ?', [session.user_id]);
    if (company.status !== 'active') {
      return res.status(403).json({ error: 'Ваша компания не активна' });
    }

    const eventId = uuidv4();

    await run(
      `INSERT INTO events (id, company_id, type, title, description, requirements, application_deadline, event_date, event_time, format, max_participants, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, session.user_id, type, title, description, requirements, application_deadline, event_date, event_time, format, max_participants, 'pending']
    );

    await logAction(session.user_id, 'company', 'create_event', 'event', eventId);

    const newEvent = await get('SELECT * FROM events WHERE id = ?', [eventId]);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= APPLICATIONS (ЗАЯВКИ) =============

// Submit application
app.post('/api/applications', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { event_id, text_content } = req.body;

    if (!token || !event_id) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'student']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const event = await get('SELECT * FROM events WHERE id = ?', [event_id]);
    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }

    // Check deadline
    if (new Date(event.application_deadline) < new Date()) {
      return res.status(400).json({ error: 'Срок подачи заявок истек' });
    }

    const applicationId = uuidv4();

    await run(
      `INSERT INTO applications (id, event_id, student_id, text_content, status)
       VALUES (?, ?, ?, ?, ?)`,
      [applicationId, event_id, session.user_id, text_content, 'new']
    );

    await logAction(session.user_id, 'student', 'apply', 'event', event_id);

    const application = await get('SELECT * FROM applications WHERE id = ?', [applicationId]);
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student applications
app.get('/api/student/applications', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'student']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const applications = await all(
      `SELECT a.*, e.title, e.type, c.name as company_name
       FROM applications a
       JOIN events e ON a.event_id = e.id
       JOIN companies c ON e.company_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC`,
      [session.user_id]
    );

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get company applications
app.get('/api/company/applications', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const applications = await all(
      `SELECT a.*, e.title, s.full_name, s.email, s.university
       FROM applications a
       JOIN events e ON a.event_id = e.id
       JOIN students s ON a.student_id = s.id
       WHERE e.company_id = ?
       ORDER BY a.created_at DESC`,
      [session.user_id]
    );

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
app.put('/api/applications/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { status } = req.body;

    if (!token || !status) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const application = await get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const event = await get('SELECT company_id FROM events WHERE id = ?', [application.event_id]);
    if (event.company_id !== session.user_id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    await run('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);

    await logAction(session.user_id, 'company', 'update_application', 'application', req.params.id, { status });

    const updated = await get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= COMPANY PROFILE =============

app.get('/api/company/:id', async (req, res) => {
  try {
    const company = await get(
      'SELECT id, name, description, city, website, logo_path, status FROM companies WHERE id = ? AND status = ?',
      [req.params.id, 'active']
    );

    if (!company) {
      return res.status(404).json({ error: 'Компания не найдена' });
    }

    const media = await all('SELECT * FROM company_media WHERE company_id = ? ORDER BY position', [req.params.id]);
    const events = await all('SELECT * FROM events WHERE company_id = ? AND status = ?', [req.params.id, 'active']);

    res.json({ company, media, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= COMPANY DASHBOARD =============

app.get('/api/company/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const company = await get('SELECT * FROM companies WHERE id = ?', [session.user_id]);
    const events = await all('SELECT * FROM events WHERE company_id = ? ORDER BY created_at DESC', [session.user_id]);
    const applicationCount = await get(
      'SELECT COUNT(*) as count FROM applications a JOIN events e ON a.event_id = e.id WHERE e.company_id = ?',
      [session.user_id]
    );

    res.json({ company, events, applicationCount: applicationCount.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= STUDENT DASHBOARD =============

app.get('/api/student/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'student']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const student = await get('SELECT * FROM students WHERE id = ?', [session.user_id]);
    const applications = await all(
      `SELECT a.*, e.title, e.type, c.name as company_name
       FROM applications a
       JOIN events e ON a.event_id = e.id
       JOIN companies c ON e.company_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC`,
      [session.user_id]
    );

    res.json({ student, applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= AUTH ROUTES =============

app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const admin = await get('SELECT * FROM admins WHERE email = ?', [email]);
    if (!admin) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const passwordMatch = await comparePasswords(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const token = generateToken(admin.id);
    await createSession(admin.id, 'admin', token);
    await logAction(admin.id, 'admin', 'login');

    const { password: _, ...adminWithoutPassword } = admin;
    res.json({ user: adminWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN ROUTES =============

app.post('/api/admin/login', async (req, res) => {
  console.log('Admin login attempt with body:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    console.log('Looking up admin with email:', email);
    const admin = await get('SELECT * FROM admins WHERE email = ?', [email]);
    if (!admin) {
      console.log('Admin not found for email:', email);
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    console.log('Admin found:', { id: admin.id, email: admin.email });

    console.log('Verifying password...');
    const passwordMatch = await comparePasswords(password, admin.password);
    if (!passwordMatch) {
      console.log('Password mismatch for admin:', admin.id);
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    console.log('Password verified successfully');

    const token = generateToken(admin.id);
    console.log('Generated token:', token);

    await createSession(admin.id, 'admin', token);
    console.log('Session created for admin:', admin.id);

    await logAction(admin.id, 'admin', 'login');
    console.log('Login action logged');

    res.json({ admin: { id: admin.id, email: admin.email, name: admin.name }, token });
    console.log('Admin login successful:', { id: admin.id, email: admin.email, name: admin.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/companies', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const companies = await all('SELECT * FROM companies ORDER BY created_at DESC');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/company/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { status } = req.body;

    if (!token || !status) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await run('UPDATE companies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    await logAction(session.user_id, 'admin', 'update_company_status', 'company', req.params.id, { status });

    const company = await get('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const stats = {
      students: await get('SELECT COUNT(*) as count FROM students'),
      companies: await get('SELECT COUNT(*) as count FROM companies WHERE status = ?', ['active']),
      events: await get('SELECT COUNT(*) as count FROM events WHERE status = ?', ['active']),
      applications: await get('SELECT COUNT(*) as count FROM applications'),
      pendingCompanies: await get('SELECT COUNT(*) as count FROM companies WHERE status = ?', ['pending']),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/logs', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const logs = await all('SELECT * FROM logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN STUDENTS =============

app.get('/api/admin/students', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const students = await all('SELECT id, email, full_name, university, course, city, created_at FROM students ORDER BY created_at DESC');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/students/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await run('DELETE FROM applications WHERE student_id = ?', [req.params.id]);
    await run('DELETE FROM sessions WHERE user_id = ? AND user_type = ?', [req.params.id, 'student']);
    await run('DELETE FROM students WHERE id = ?', [req.params.id]);
    await logAction(session.user_id, 'admin', 'delete_student', 'student', req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN EVENTS =============

app.get('/api/admin/events', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const events = await all(`
      SELECT e.*, c.name as company_name
      FROM events e
      JOIN companies c ON e.company_id = c.id
      ORDER BY e.created_at DESC
    `);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/events/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { status } = req.body;

    if (!token || !status) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await run('UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    await logAction(session.user_id, 'admin', 'update_event_status', 'event', req.params.id, { status });

    const event = await get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/events/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await run('DELETE FROM applications WHERE event_id = ?', [req.params.id]);
    await run('DELETE FROM events WHERE id = ?', [req.params.id]);
    await logAction(session.user_id, 'admin', 'delete_event', 'event', req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN APPLICATIONS =============

app.get('/api/admin/applications', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const applications = await all(`
      SELECT a.*, 
             s.full_name as student_name, s.email as student_email, s.university,
             e.title as event_title,
             c.name as company_name
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN events e ON a.event_id = e.id
      JOIN companies c ON e.company_id = c.id
      ORDER BY a.created_at DESC
    `);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/applications/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { status } = req.body;

    if (!token || !status) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await run('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    await logAction(session.user_id, 'admin', 'update_application_status', 'application', req.params.id, { status });

    const application = await get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN ADMINS =============

app.get('/api/admin/admins', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const admins = await all('SELECT id, email, name, created_at FROM admins ORDER BY created_at DESC');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ERROR HANDLING =============

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера', details: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
