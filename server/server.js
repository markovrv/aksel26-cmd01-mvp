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

// ============= UNIFIED AUTH ROUTES =============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, email, password, ...profileData } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    if (!['student', 'company', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' });
    }

    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);

    await run(
      'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
      [userId, email, hashedPassword, role]
    );

    // Create profile based on role
    if (role === 'student') {
      await run(
        'INSERT INTO student_profiles (id, user_id, first_name, last_name, university, course, specialization, city, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), userId, profileData.first_name, profileData.last_name, profileData.university, profileData.course, profileData.specialization, profileData.city, profileData.phone]
      );
    } else if (role === 'company') {
      await run(
        'INSERT INTO company_profiles (id, user_id, name, short_description, full_description, city, address, latitude, longitude, contact_person, contact_phone, contact_email, moderation_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), userId, profileData.name, profileData.short_description, profileData.full_description, profileData.city, profileData.address, profileData.latitude, profileData.longitude, profileData.contact_person, profileData.contact_phone, profileData.contact_email, 'moderation']
      );
    } else if (role === 'admin') {
      await run(
        'INSERT INTO admin_profiles (id, user_id, name) VALUES (?, ?, ?)',
        [uuidv4(), userId, profileData.name]
      );
    }

    const token = generateToken(userId);
    await createSession(userId, role, token);
    await logAction(userId, role, 'register');

    const user = await get('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, пароль и роль обязательны' });
    }

    const user = await get('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    if (!user) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const token = generateToken(user.id);
    await createSession(user.id, role, token);
    await logAction(user.id, role, 'login');

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
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

// ============= COMPANY PROFILE ROUTES =============

// Get companies with active cases for map display
app.get('/api/map/companies', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    let studentId = null;

    // Get student ID if authenticated
    if (token) {
      const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'student']);
      if (session) {
        const studentProfile = await get('SELECT id FROM student_profiles WHERE user_id = ?', [session.user_id]);
        studentId = studentProfile?.id;
      }
    }

    // Get companies with their coordinates and case stats
    const companies = await all(`
      SELECT
        cp.id,
        cp.user_id as company_user_id,
        cp.name,
        cp.city,
        cp.latitude,
        cp.longitude,
        cp.short_description,
        COUNT(c.id) as active_cases_count,
        CASE WHEN ? IS NOT NULL AND EXISTS(
          SELECT 1 FROM solutions s
          JOIN cases c2 ON s.case_id = c2.id
          WHERE (c2.company_id = cp.id OR c2.company_id = cp.user_id) AND s.student_id = ?
        ) THEN 1 ELSE 0 END as has_student_solution
      FROM company_profiles cp
      LEFT JOIN cases c ON (cp.id = c.company_id OR cp.user_id = c.company_id) AND c.status = 'active'
      WHERE cp.moderation_status = 'active'
        AND cp.latitude IS NOT NULL
        AND cp.longitude IS NOT NULL
      GROUP BY cp.id, cp.user_id, cp.name, cp.city, cp.latitude, cp.longitude, cp.short_description
      ORDER BY cp.name
    `, [studentId, studentId]);

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const company = await get(
      'SELECT cp.*, u.email FROM company_profiles cp JOIN users u ON cp.user_id = u.id WHERE cp.id = ? AND cp.moderation_status = ?',
      [req.params.id, 'active']
    );

    if (!company) {
      return res.status(404).json({ error: 'Компания не найдена' });
    }

    const cases = await all(
      `SELECT * FROM cases
       WHERE (company_id = ? OR company_id = (SELECT user_id FROM company_profiles WHERE id = ?))
         AND status = 'active'
         AND datetime(application_deadline) >= datetime('now')
       ORDER BY created_at DESC`,
      [req.params.id, req.params.id]
    );
    res.json({ company, cases });
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

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await get('SELECT user_id, user_type FROM sessions WHERE token = ?', [token]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    let user;
    if (session.user_type === 'student') {
      user = await get('SELECT sp.*, u.email FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.user_id = ?', [session.user_id]);
    } else if (session.user_type === 'company') {
      user = await get('SELECT cp.*, u.email FROM company_profiles cp JOIN users u ON cp.user_id = u.id WHERE cp.user_id = ?', [session.user_id]);
    } else if (session.user_type === 'admin') {
      user = await get('SELECT ap.*, u.email FROM admin_profiles ap JOIN users u ON ap.user_id = u.id WHERE ap.user_id = ?', [session.user_id]);
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user, userType: session.user_type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= CASES =============

// Get all active cases
app.get('/api/cases', async (req, res) => {
  try {
    const search = req.query.search;
    const type = req.query.type;

    if (type && type !== 'case') {
      return res.json([]);
    }

    let query = `
      SELECT c.*, cp.id as company_profile_id, cp.user_id as company_user_id, cp.name as company_name, cp.city as company_city
      FROM cases c
      JOIN company_profiles cp ON (c.company_id = cp.id OR c.company_id = cp.user_id)
      WHERE c.status = 'active'
        AND cp.moderation_status = 'active'
        AND datetime(c.application_deadline) >= datetime('now')
    `;
    const params = [];

    if (search) {
      query += ' AND (c.title LIKE ? OR cp.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.created_at DESC';

    const cases = await all(query, params);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get case detail
app.get('/api/cases/:id', async (req, res) => {
  try {
    const caseItem = await get(
      `SELECT c.*, cp.name as company_name, cp.short_description as company_description, cp.city
       FROM cases c
       JOIN company_profiles cp ON (c.company_id = cp.id OR c.company_id = cp.user_id)
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!caseItem) {
      return res.status(404).json({ error: 'Кейс не найден' });
    }

    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create case (company only)
app.post('/api/cases', upload.single('task_file'), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { title, description, requirements, application_deadline } = req.body;

    if (!token || !title || !description || !application_deadline) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const company = await get('SELECT id, moderation_status FROM company_profiles WHERE user_id = ?', [session.user_id]);
    if (company.moderation_status !== 'active') {
      return res.status(403).json({ error: 'Ваша компания не активна' });
    }

    const caseId = uuidv4();
    let taskFilePath = null;

    // Handle file upload if present
    if (req.file) {
      taskFilePath = req.file.filename;
    }

    await run(
      `INSERT INTO cases (id, company_id, title, description, requirements, application_deadline, task_file_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [caseId, company.id, title, description, requirements, application_deadline, taskFilePath, 'draft']
    );

    await logAction(session.user_id, 'company', 'create_case', 'case', caseId);

    const newCase = await get('SELECT * FROM cases WHERE id = ?', [caseId]);
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update case (company only)
app.put('/api/cases/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { title, description, requirements, application_deadline } = req.body;

    if (!token || !title || !description || !application_deadline) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const company = await get('SELECT id, user_id FROM company_profiles WHERE user_id = ?', [session.user_id]);
    if (!company) {
      return res.status(404).json({ error: 'Профиль компании не найден' });
    }

    const existingCase = await get('SELECT * FROM cases WHERE id = ? AND (company_id = ? OR company_id = ?)', [req.params.id, company.id, company.user_id]);
    if (!existingCase) {
      return res.status(404).json({ error: 'Кейс не найден или у вас нет прав на его редактирование' });
    }

    await run(
      `UPDATE cases SET title = ?, description = ?, requirements = ?, application_deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, description, requirements, application_deadline, req.params.id]
    );

    await logAction(session.user_id, 'company', 'update_case', 'case', req.params.id);

    const updatedCase = await get('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete case (company only)
app.delete('/api/cases/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const company = await get('SELECT id, user_id FROM company_profiles WHERE user_id = ?', [session.user_id]);
    if (!company) {
      return res.status(404).json({ error: 'Профиль компании не найден' });
    }

    const existingCase = await get('SELECT * FROM cases WHERE id = ? AND (company_id = ? OR company_id = ?)', [req.params.id, company.id, company.user_id]);
    if (!existingCase) {
      return res.status(404).json({ error: 'Кейс не найден или у вас нет прав на его удаление' });
    }

    await run('DELETE FROM solutions WHERE case_id = ?', [req.params.id]);
    await run('DELETE FROM cases WHERE id = ?', [req.params.id]);

    await logAction(session.user_id, 'company', 'delete_case', 'case', req.params.id);

    res.json({ message: 'Кейс удален' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SOLUTIONS =============

// Submit solution
app.post('/api/solutions', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { case_id, text_content } = req.body;

    if (!token || !case_id || !text_content) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'student']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    const studentProfile = await get('SELECT id FROM student_profiles WHERE user_id = ?', [session.user_id]);
    if (!studentProfile) {
      return res.status(404).json({ error: 'Профиль студента не найден' });
    }

    const caseItem = await get('SELECT * FROM cases WHERE id = ?', [case_id]);
    if (!caseItem) {
      return res.status(404).json({ error: 'Кейс не найден' });
    }

    // Check deadline
    if (caseItem.status !== 'active') {
      return res.status(400).json({ error: 'Кейс недоступен для откликов' });
    }
    if (new Date(caseItem.application_deadline) < new Date()) {
      return res.status(400).json({ error: 'Срок подачи решений истек' });
    }

    const solutionId = uuidv4();
    let filePath = null;
    let fileName = null;

    // Handle file upload if present
    if (req.file) {
      filePath = req.file.filename;
      fileName = req.file.originalname;
    }

    await run(
      `INSERT INTO solutions (id, case_id, student_id, text_content, file_path, file_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [solutionId, case_id, studentProfile.id, text_content, filePath, fileName, 'new']
    );

    await logAction(session.user_id, 'student', 'submit_solution', 'case', case_id);

    const solution = await get('SELECT * FROM solutions WHERE id = ?', [solutionId]);
    res.status(201).json(solution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student solutions
app.get('/api/student/solutions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'student']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const studentProfile = await get('SELECT id FROM student_profiles WHERE user_id = ?', [session.user_id]);
    const solutions = await all(
      `SELECT s.*, c.title as case_title, cp.name as company_name
       FROM solutions s
       JOIN cases c ON s.case_id = c.id
       JOIN company_profiles cp ON (c.company_id = cp.id OR c.company_id = cp.user_id)
       WHERE s.student_id = ?
       ORDER BY s.created_at DESC`,
      [studentProfile?.id]
    );

    res.json(solutions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get company solutions
app.get('/api/company/solutions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const companyProfile = await get('SELECT id FROM company_profiles WHERE user_id = ?', [session.user_id]);

    const solutions = await all(
      `SELECT s.*, c.title as case_title, sp.first_name, sp.last_name, u.email, sp.university
       FROM solutions s
       JOIN cases c ON s.case_id = c.id
       JOIN student_profiles sp ON s.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE c.company_id = ?
       ORDER BY s.created_at DESC`,
      [companyProfile.id]
    );

    res.json(solutions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get solutions by case
app.get('/api/cases/:caseId/solutions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const companyProfile = await get('SELECT id FROM company_profiles WHERE user_id = ?', [session.user_id]);
    const caseItem = await get('SELECT company_id FROM cases WHERE id = ?', [req.params.caseId]);
    if (!caseItem) {
      return res.status(404).json({ error: 'Кейс не найден' });
    }

    if (caseItem.company_id !== companyProfile.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const solutions = await all(
      `SELECT s.*, sp.first_name, sp.last_name, u.email, sp.university
       FROM solutions s
       JOIN student_profiles sp ON s.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE s.case_id = ?
       ORDER BY s.created_at DESC`,
      [req.params.caseId]
    );

    res.json(solutions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update solution status
app.put('/api/solutions/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { status } = req.body;

    if (!token || !status) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }
    if (!['new', 'viewed', 'invited', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Некорректный статус решения' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'company']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const solution = await get('SELECT * FROM solutions WHERE id = ?', [req.params.id]);
    if (!solution) {
      return res.status(404).json({ error: 'Решение не найдено' });
    }

    const caseItem = await get('SELECT company_id FROM cases WHERE id = ?', [solution.case_id]);
    const companyProfile = await get('SELECT id FROM company_profiles WHERE user_id = ?', [session.user_id]);

    if (caseItem.company_id !== companyProfile.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    await run('UPDATE solutions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    const studentOwner = await get('SELECT user_id FROM student_profiles WHERE id = ?', [solution.student_id]);
    await run(
      'INSERT INTO notifications (id, user_id, text, link_type, link_id) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), studentOwner?.user_id, `Статус вашего решения обновлен: ${status}`, 'solution', solution.id]
    );

    await logAction(session.user_id, 'company', 'update_solution', 'solution', req.params.id, { status });

    const updated = await get('SELECT * FROM solutions WHERE id = ?', [req.params.id]);
    res.json(updated);
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

    const company = await get('SELECT * FROM company_profiles WHERE user_id = ?', [session.user_id]);
    const cases = await all('SELECT * FROM cases WHERE company_id = ? OR company_id = ? ORDER BY created_at DESC', [company.id, company.user_id]);
    const solutionCount = await get(
      'SELECT COUNT(*) as count FROM solutions s JOIN cases c ON s.case_id = c.id WHERE c.company_id = ? OR c.company_id = ?',
      [company.id, company.user_id]
    );

    res.json({ company, cases, solutionCount: solutionCount.count });
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

    const student = await get('SELECT * FROM student_profiles WHERE user_id = ?', [session.user_id]);
    const solutions = await all(
      `SELECT s.*, c.title as case_title, cp.name as company_name
       FROM solutions s
       JOIN cases c ON s.case_id = c.id
       JOIN company_profiles cp ON (c.company_id = cp.id OR c.company_id = cp.user_id)
       WHERE s.student_id = ?
       ORDER BY s.created_at DESC`,
      [student.id]
    );

    res.json({ student, solutions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// ============= ADMIN ROUTES =============

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

    const companies = await all('SELECT cp.*, u.email FROM company_profiles cp JOIN users u ON cp.user_id = u.id ORDER BY cp.created_at DESC');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/companies/:id/status', async (req, res) => {
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

    await run('UPDATE company_profiles SET moderation_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    await logAction(session.user_id, 'admin', 'update_company_status', 'company', req.params.id, { status });

    const company = await get('SELECT * FROM company_profiles WHERE id = ?', [req.params.id]);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    const students = await all('SELECT sp.*, u.email FROM student_profiles sp JOIN users u ON sp.user_id = u.id ORDER BY sp.created_at DESC');
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

    await run('DELETE FROM solutions WHERE student_id = ?', [req.params.id]);
    await run('DELETE FROM student_profiles WHERE id = ?', [req.params.id]);
    await run('DELETE FROM sessions WHERE user_id = ? AND user_type = ?', [req.params.id, 'student']);
    await run('DELETE FROM users WHERE id = ?', [req.params.id]);
    await logAction(session.user_id, 'admin', 'delete_student', 'student', req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/cases', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const cases = await all(`
      SELECT c.*, cp.name as company_name
      FROM cases c
      JOIN company_profiles cp ON (c.company_id = cp.id OR c.company_id = cp.user_id)
      ORDER BY c.created_at DESC
    `);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/cases/:id/status', async (req, res) => {
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

    await run('UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    await logAction(session.user_id, 'admin', 'update_case_status', 'case', req.params.id, { status });

    const caseItem = await get('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/cases/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await run('DELETE FROM solutions WHERE case_id = ?', [req.params.id]);
    await run('DELETE FROM cases WHERE id = ?', [req.params.id]);
    await logAction(session.user_id, 'admin', 'delete_case', 'case', req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/solutions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ? AND user_type = ?', [token, 'admin']);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const solutions = await all(`
      SELECT s.*,
             sp.first_name, sp.last_name, u.email, sp.university,
             c.title as case_title,
             cp.name as company_name
      FROM solutions s
      JOIN student_profiles sp ON s.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      JOIN cases c ON s.case_id = c.id
      JOIN company_profiles cp ON (c.company_id = cp.id OR c.company_id = cp.user_id)
      ORDER BY s.created_at DESC
    `);
    res.json(solutions);
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

    const companies = await all(
      'SELECT cp.*, u.email FROM company_profiles cp JOIN users u ON cp.user_id = u.id ORDER BY cp.created_at DESC'
    );
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

    await run(
      'UPDATE company_profiles SET moderation_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );
    await logAction(session.user_id, 'admin', 'update_company_status', 'company', req.params.id, { status });

    const company = await get('SELECT * FROM company_profiles WHERE id = ?', [req.params.id]);
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
      students: await get('SELECT COUNT(*) as count FROM student_profiles'),
      companies: await get('SELECT COUNT(*) as count FROM company_profiles WHERE moderation_status = ?', ['active']),
      cases: await get('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['active']),
      solutions: await get('SELECT COUNT(*) as count FROM solutions'),
      pendingCompanies: await get('SELECT COUNT(*) as count FROM company_profiles WHERE moderation_status = ?', ['moderation']),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= NOTIFICATIONS =============

app.get('/api/notifications', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const session = await get('SELECT user_id FROM sessions WHERE token = ?', [token]);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const notifications = await all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [session.user_id]
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    const session = await get('SELECT user_id FROM sessions WHERE token = ?', [token]);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, session.user_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    const session = await get('SELECT user_id FROM sessions WHERE token = ?', [token]);
    if (!session) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [session.user_id]);
    res.json({ success: true });
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

    const admins = await all(
      `SELECT ap.id, ap.name, u.email, ap.created_at
       FROM admin_profiles ap
       JOIN users u ON ap.user_id = u.id
       ORDER BY ap.created_at DESC`
    );
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
