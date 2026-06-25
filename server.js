import 'dotenv/config';
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'found2work-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

function publicUser(row) {
  if (!row) return null;
  const { password: _pw, ...rest } = row;
  return rest;
}

function signTokenForUser(user) {
  return jwt.sign({ sub: Number(user.id) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// SQLite Database Setup
const db = new sqlite3.Database('data.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

const runQuery = promisify(db.run.bind(db));
const getQuery = promisify(db.get.bind(db));
const allQuery = promisify(db.all.bind(db));

async function ensureColumn(tableName, columnName, definition) {
  const columns = await allQuery(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

// Initialize Database Tables
async function initializeDatabase() {
  try {
    // Users table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'seeker',
        agreedToTerms INTEGER NOT NULL DEFAULT 0,
        city TEXT,
        phone TEXT,
        specialization TEXT,
        experience TEXT,
        about TEXT,
        skills TEXT,
        desiredPosition TEXT,
        education TEXT,
        portfolio TEXT,
        resumeFile BLOB,
        resumeFileName TEXT,
        companySize TEXT,
        industry TEXT,
        blocked INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await ensureColumn('users', 'agreedToTerms', 'INTEGER NOT NULL DEFAULT 0');
    await ensureColumn('users', 'desiredPosition', 'TEXT');
    await ensureColumn('users', 'education', 'TEXT');
    await ensureColumn('users', 'portfolio', 'TEXT');

    // Vacancies table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS vacancies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employerId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        salary TEXT,
        location TEXT NOT NULL,
        company TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'full-time',
        requirements TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        moderationStatus TEXT NOT NULL DEFAULT 'approved',
        moderationComment TEXT,
        views INTEGER DEFAULT 0,
        applications INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employerId) REFERENCES users(id)
      )
    `);
    await ensureColumn('vacancies', 'moderationStatus', 'TEXT NOT NULL DEFAULT "approved"');
    await ensureColumn('vacancies', 'moderationComment', 'TEXT');
    await ensureColumn('vacancies', 'startupStage', 'TEXT NOT NULL DEFAULT "mvp"');
    await ensureColumn('vacancies', 'teamPace', 'TEXT NOT NULL DEFAULT "balanced"');
    await ensureColumn('vacancies', 'workStyle', 'TEXT NOT NULL DEFAULT "flexible"');
    await runQuery('UPDATE vacancies SET moderationStatus = "approved" WHERE moderationStatus IS NULL');

    // Applications table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        vacancyId INTEGER NOT NULL,
        coverLetter TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        vacancyId INTEGER,
        text TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users(id),
        FOREIGN KEY (receiverId) REFERENCES users(id),
        FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
      )
    `);

    // Saved jobs table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS saved_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        vacancyId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS employer_blocks (
        userId INTEGER NOT NULL,
        employerId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, employerId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (employerId) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS hidden_vacancies (
        userId INTEGER NOT NULL,
        vacancyId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, vacancyId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS vacancy_moderation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vacancyId INTEGER NOT NULL,
        moderationStatus TEXT NOT NULL,
        moderationComment TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
      )
    `);

    // Reports table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reportedBy INTEGER NOT NULL,
        reportedUser INTEGER,
        contentType TEXT,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reportedBy) REFERENCES users(id),
        FOREIGN KEY (reportedUser) REFERENCES users(id)
      )
    `);

    // Load demo data
    await loadDemoData();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Load demo data
async function loadDemoData() {
  try {
    // Check if demo data already exists
    const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
      console.log('📊 Demo data already loaded');
      return;
    }

    // Insert demo users
    const users = [
      { email: 'alex@example.com', password: 'password123', name: 'Александр Иванов', type: 'seeker', city: 'Москва', specialization: 'Frontend Developer', experience: '3 года' },
      { email: 'maria@example.com', password: 'password123', name: 'Мария Петрова', type: 'seeker', city: 'СПб', specialization: 'Backend Developer', experience: '5 лет' },
      { email: 'john@example.com', password: 'password123', name: 'John Smith', type: 'seeker', city: 'Moscow', specialization: 'Full Stack', experience: '4 года' },
      { email: 'hr@techcorp.com', password: 'password123', name: 'TechCorp HR', type: 'employer', city: 'Москва', companySize: '100-500', industry: 'IT' },
      { email: 'admin@found2work.com', password: 'admin123', name: 'Admin User', type: 'admin', city: 'Москва' }
    ];

    const userIds = {};
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const result = await new Promise((resolve) => {
        db.run(
          'INSERT INTO users (email, password, name, type, city, phone, specialization, experience, about, skills, companySize, industry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user.email, passwordHash, user.name, user.type, user.city || null, null, user.specialization || null, user.experience || null, null, null, user.companySize || null, user.industry || null],
          function(err) {
            if (!err) userIds[user.email] = this.lastID;
            resolve(this.lastID);
          }
        );
      });
    }

    // Insert demo vacancies
    const vacancies = [
      {
        employerId: userIds['hr@techcorp.com'],
        title: 'Senior Frontend Developer',
        description: 'Ищем опытного Frontend разработчика с опытом React и TypeScript',
        salary: '150000-180000',
        location: 'Москва',
        company: 'TechCorp',
        type: 'full-time',
        requirements: 'React, TypeScript, CSS, Git'
      },
      {
        employerId: userIds['hr@techcorp.com'],
        title: 'Backend Developer (Node.js)',
        description: 'Разработка серверной части приложения на Node.js',
        salary: '140000-170000',
        location: 'Москва',
        company: 'TechCorp',
        type: 'full-time',
        requirements: 'Node.js, Express, MongoDB, REST API'
      },
      {
        employerId: userIds['hr@techcorp.com'],
        title: 'QA Engineer',
        description: 'Тестирование веб-приложений, написание тестов',
        salary: '100000-130000',
        location: 'Москва',
        company: 'TechCorp',
        type: 'full-time',
        requirements: 'Jest, Selenium, SQL'
      },
      {
        employerId: userIds['hr@techcorp.com'],
        title: 'DevOps Engineer',
        description: 'Управление инфраструктурой и CI/CD',
        salary: '160000-200000',
        location: 'Москва',
        company: 'TechCorp',
        type: 'full-time',
        requirements: 'Docker, Kubernetes, AWS'
      }
    ];

    for (const vacancy of vacancies) {
      await runQuery(
        'INSERT INTO vacancies (employerId, title, description, salary, location, company, type, requirements, status, views, applications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [vacancy.employerId, vacancy.title, vacancy.description, vacancy.salary, vacancy.location, vacancy.company, vacancy.type, vacancy.requirements, 'active', 0, 0]
      );
    }

    console.log('📊 Demo data loaded successfully');
  } catch (error) {
    console.error('Error loading demo data:', error);
  }
}

// Initialize database
initializeDatabase();

// ============= API ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, type, agreedToTerms } = req.body;
    
    if (!email || !password || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!agreedToTerms) {
      return res.status(400).json({ error: 'Необходимо принять пользовательское соглашение' });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password, name, type, agreedToTerms) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, name, type, 1],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    const fullRow = await getQuery('SELECT * FROM users WHERE id = ?', [result.id]);
    const safe = publicUser(fullRow);
    const token = signTokenForUser(safe);
    res.json({ success: true, user: safe, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isHashedPassword = typeof user.password === 'string' && user.password.startsWith('$2');
    const isValidPassword = isHashedPassword
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!isHashedPassword) {
      const newHash = await bcrypt.hash(password, 10);
      await runQuery('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      user.password = newHash;
    }

    if (Number(user.blocked)) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    const safe = publicUser(user);
    const token = signTokenForUser(safe);
    res.json({ success: true, user: safe, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!raw) {
      return res.status(401).json({ error: 'Требуется токен авторизации' });
    }
    let payload;
    try {
      payload = jwt.verify(raw, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Недействительный или истёкший токен' });
    }
    const userId = Number(payload.sub);
    const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    if (Number(user.blocked)) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await allQuery('SELECT id, email, name, type, city, specialization, experience, blocked, createdAt FROM users');
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const allowedFields = [
      'name', 'city', 'phone', 'specialization', 'experience', 'about', 'skills',
      'resumeFile', 'resumeFileName', 'companySize', 'industry', 'blocked',
      'desiredPosition', 'education', 'portfolio'
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => updates[field]);
    await runQuery(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, req.params.id]);

    const user = await getQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET all vacancies
app.get('/api/vacancies', async (req, res) => {
  try {
    const vacancies = await allQuery(
      'SELECT * FROM vacancies WHERE status = "active" AND moderationStatus = "approved" ORDER BY createdAt DESC'
    );
    res.json(vacancies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/vacancies/all', async (req, res) => {
  try {
    const vacancies = await allQuery('SELECT * FROM vacancies ORDER BY createdAt DESC');
    res.json(vacancies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET vacancy by ID
app.get('/api/vacancies/:id', async (req, res) => {
  try {
    const vacancy = await getQuery('SELECT * FROM vacancies WHERE id = ?', [req.params.id]);
    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });
    
    await runQuery('UPDATE vacancies SET views = views + 1 WHERE id = ?', [req.params.id]);
    
    res.json(vacancy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET employer vacancies
app.get('/api/vacancies/employer/:id', async (req, res) => {
  try {
    const vacancies = await allQuery('SELECT * FROM vacancies WHERE employerId = ? ORDER BY createdAt DESC', [req.params.id]);
    res.json(vacancies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST new vacancy
app.post('/api/vacancies', async (req, res) => {
  try {
    const {
      employerId,
      title,
      description,
      salary,
      location,
      company,
      type,
      requirements,
      startupStage,
      teamPace,
      workStyle
    } = req.body;
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO vacancies (employerId, title, description, salary, location, company, type, requirements, startupStage, teamPace, workStyle, status, moderationStatus, moderationComment, views, applications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          employerId,
          title,
          description,
          salary,
          location,
          company,
          type,
          requirements,
          startupStage || 'mvp',
          teamPace || 'balanced',
          workStyle || 'flexible',
          'closed',
          'pending',
          null,
          0,
          0
        ],
        function(err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            employerId,
            title,
            description,
            salary,
            location,
            company,
            type,
            requirements,
            startupStage: startupStage || 'mvp',
            teamPace: teamPace || 'balanced',
            workStyle: workStyle || 'flexible',
            status: 'closed',
            moderationStatus: 'pending'
          });
        }
      );
    });

    res.json({ success: true, vacancy: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update vacancy
app.put('/api/vacancies/:id', async (req, res) => {
  try {
    const { title, description, salary, location, company, type, requirements, startupStage, teamPace, workStyle, status } = req.body;
    
    await runQuery(
      'UPDATE vacancies SET title = ?, description = ?, salary = ?, location = ?, company = ?, type = ?, requirements = ?, startupStage = ?, teamPace = ?, workStyle = ?, status = ? WHERE id = ?',
      [title, description, salary, location, company, type, requirements, startupStage || 'mvp', teamPace || 'balanced', workStyle || 'flexible', status, req.params.id]
    );

    const vacancy = await getQuery('SELECT * FROM vacancies WHERE id = ?', [req.params.id]);
    res.json({ success: true, vacancy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/vacancies/:id/moderation', async (req, res) => {
  try {
    const { moderationStatus, moderationComment } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(moderationStatus)) {
      return res.status(400).json({ error: 'Invalid moderationStatus' });
    }

    let nextStatus = 'closed';
    if (moderationStatus === 'approved') {
      nextStatus = 'active';
    }
    if (moderationStatus === 'pending') {
      nextStatus = 'closed';
    }

    await runQuery(
      'UPDATE vacancies SET moderationStatus = ?, moderationComment = ?, status = ? WHERE id = ?',
      [moderationStatus, moderationComment || null, nextStatus, req.params.id]
    );
    await runQuery(
      'INSERT INTO vacancy_moderation_log (vacancyId, moderationStatus, moderationComment) VALUES (?, ?, ?)',
      [req.params.id, moderationStatus, moderationComment || null]
    );
    const vacancy = await getQuery('SELECT * FROM vacancies WHERE id = ?', [req.params.id]);
    res.json({ success: true, vacancy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/moderation-log', async (req, res) => {
  try {
    const rows = await allQuery(`
      SELECT l.id, l.vacancyId, l.moderationStatus, l.moderationComment, l.createdAt,
             v.title AS vacancyTitle, v.company AS vacancyCompany
      FROM vacancy_moderation_log l
      LEFT JOIN vacancies v ON v.id = l.vacancyId
      ORDER BY l.createdAt DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Seeker: скрыть все вакансии работодателя
app.get('/api/users/:userId/blocked-employers', async (req, res) => {
  try {
    const rows = await allQuery(
      'SELECT employerId FROM employer_blocks WHERE userId = ? ORDER BY createdAt DESC',
      [req.params.userId]
    );
    res.json(rows.map((r) => r.employerId));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/users/:userId/blocked-employers', async (req, res) => {
  try {
    const employerId = Number(req.body.employerId);
    if (!employerId) {
      return res.status(400).json({ error: 'employerId is required' });
    }
    await runQuery(
      'INSERT OR IGNORE INTO employer_blocks (userId, employerId) VALUES (?, ?)',
      [req.params.userId, employerId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/blocked-employers/:employerId', async (req, res) => {
  try {
    await runQuery(
      'DELETE FROM employer_blocks WHERE userId = ? AND employerId = ?',
      [req.params.userId, req.params.employerId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:userId/hidden-vacancies', async (req, res) => {
  try {
    const rows = await allQuery(
      'SELECT vacancyId FROM hidden_vacancies WHERE userId = ? ORDER BY createdAt DESC',
      [req.params.userId]
    );
    res.json(rows.map((r) => r.vacancyId));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/users/:userId/hidden-vacancies', async (req, res) => {
  try {
    const vacancyId = Number(req.body.vacancyId);
    if (!vacancyId) {
      return res.status(400).json({ error: 'vacancyId is required' });
    }
    await runQuery(
      'INSERT OR IGNORE INTO hidden_vacancies (userId, vacancyId) VALUES (?, ?)',
      [req.params.userId, vacancyId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/hidden-vacancies/:vacancyId', async (req, res) => {
  try {
    await runQuery(
      'DELETE FROM hidden_vacancies WHERE userId = ? AND vacancyId = ?',
      [req.params.userId, req.params.vacancyId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE vacancy
app.delete('/api/vacancies/:id', async (req, res) => {
  try {
    await runQuery('UPDATE vacancies SET status = "closed" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST application
app.post('/api/applications', async (req, res) => {
  try {
    const { userId, vacancyId, coverLetter } = req.body;
    
    const existingApp = await getQuery('SELECT * FROM applications WHERE userId = ? AND vacancyId = ?', [userId, vacancyId]);
    if (existingApp) {
      return res.status(400).json({ error: 'Already applied to this vacancy' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO applications (userId, vacancyId, coverLetter, status) VALUES (?, ?, ?, ?)',
        [userId, vacancyId, coverLetter, 'pending'],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, vacancyId, coverLetter, status: 'pending' });
        }
      );
    });

    // Increment applications counter on vacancy
    await runQuery('UPDATE vacancies SET applications = applications + 1 WHERE id = ?', [vacancyId]);

    res.json({ success: true, application: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET user applications
app.get('/api/applications/user/:id', async (req, res) => {
  try {
    const applications = await allQuery('SELECT * FROM applications WHERE userId = ? ORDER BY createdAt DESC', [req.params.id]);
    res.json(applications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET vacancy applications
app.get('/api/applications/vacancy/:id', async (req, res) => {
  try {
    const applications = await allQuery(`
      SELECT
        a.*,
        u.name as applicantName,
        u.email as applicantEmail,
        u.phone as applicantPhone,
        u.city as applicantCity,
        u.specialization as applicantSpecialization,
        u.experience as applicantExperience,
        u.skills as applicantSkills,
        u.resumeFile as applicantResumeFile,
        u.resumeFileName as applicantResumeFileName
      FROM applications a
      INNER JOIN users u ON u.id = a.userId
      WHERE a.vacancyId = ?
      ORDER BY a.createdAt DESC
    `, [req.params.id]);
    res.json(applications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update application status
app.put('/api/applications/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    await runQuery('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
    
    const application = await getQuery('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    res.json({ success: true, application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET all applications
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await allQuery('SELECT * FROM applications ORDER BY createdAt DESC');
    res.json(applications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST save job
app.post('/api/saved-jobs', async (req, res) => {
  try {
    const { userId, vacancyId } = req.body;
    
    const existing = await getQuery('SELECT * FROM saved_jobs WHERE userId = ? AND vacancyId = ?', [userId, vacancyId]);
    if (existing) {
      return res.status(400).json({ error: 'Job already saved' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO saved_jobs (userId, vacancyId) VALUES (?, ?)',
        [userId, vacancyId],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, vacancyId });
        }
      );
    });

    res.json({ success: true, savedJob: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET saved jobs
app.get('/api/saved-jobs/:id', async (req, res) => {
  try {
    const savedJobs = await allQuery('SELECT * FROM saved_jobs WHERE userId = ? ORDER BY createdAt DESC', [req.params.id]);
    res.json(savedJobs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE saved job
app.delete('/api/saved-jobs/:userId/:vacancyId', async (req, res) => {
  try {
    await runQuery('DELETE FROM saved_jobs WHERE userId = ? AND vacancyId = ?', [req.params.userId, req.params.vacancyId]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Messages
app.get('/api/messages/conversations/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const conversations = await allQuery(
      `
      WITH user_msgs AS (
        SELECT * FROM messages
        WHERE senderId = ? OR receiverId = ?
      ),
      thread_last AS (
        SELECT MAX(id) AS lastId
        FROM user_msgs
        GROUP BY
          CASE WHEN senderId <= receiverId THEN senderId ELSE receiverId END,
          CASE WHEN senderId >= receiverId THEN senderId ELSE receiverId END,
          COALESCE(vacancyId, -1)
      )
      SELECT
        m.id,
        m.senderId,
        m.receiverId,
        m.vacancyId,
        m.text,
        m.createdAt,
        CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END AS partnerId,
        u.name AS partnerName,
        u.email AS partnerEmail,
        v.title AS vacancyTitle
      FROM user_msgs m
      INNER JOIN thread_last tl ON m.id = tl.lastId
      LEFT JOIN users u ON u.id = CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END
      LEFT JOIN vacancies v ON v.id = m.vacancyId
      ORDER BY m.createdAt DESC
    `,
      [userId, userId, userId, userId]
    );
    res.json(conversations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/messages/thread', async (req, res) => {
  try {
    const { userId, withUserId, vacancyId } = req.query;
    if (!userId || !withUserId) {
      return res.status(400).json({ error: 'userId and withUserId are required' });
    }

    const uid = Number(userId);
    const pid = Number(withUserId);
    const vidRaw = vacancyId !== undefined && vacancyId !== null && vacancyId !== '' ? Number(vacancyId) : null;
    const hasVacancy = vidRaw !== null && !Number.isNaN(vidRaw);

    const sql = hasVacancy
      ? `SELECT m.*, u.name AS senderName
         FROM messages m
         JOIN users u ON u.id = m.senderId
         WHERE ((m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?))
           AND m.vacancyId = ?
         ORDER BY m.createdAt ASC`
      : `SELECT m.*, u.name AS senderName
         FROM messages m
         JOIN users u ON u.id = m.senderId
         WHERE ((m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?))
           AND m.vacancyId IS NULL
         ORDER BY m.createdAt ASC`;

    const params = hasVacancy ? [uid, pid, pid, uid, vidRaw] : [uid, pid, pid, uid];

    const messages = await allQuery(sql, params);
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, vacancyId, text } = req.body;
    const sid = Number(senderId);
    const rid = Number(receiverId);
    if (!sid || !rid || !text?.trim()) {
      return res.status(400).json({ error: 'senderId, receiverId and text are required' });
    }
    if (sid === rid) {
      return res.status(400).json({ error: 'Нельзя отправить сообщение самому себе' });
    }
    const receiver = await getQuery('SELECT id FROM users WHERE id = ?', [rid]);
    if (!receiver) {
      return res.status(400).json({ error: 'Получатель не найден' });
    }

    const vid = vacancyId !== undefined && vacancyId !== null && vacancyId !== '' ? Number(vacancyId) : null;

    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO messages (senderId, receiverId, vacancyId, text) VALUES (?, ?, ?, ?)',
        [sid, rid, Number.isFinite(vid) && vid > 0 ? vid : null, text.trim()],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    const message = await getQuery('SELECT * FROM messages WHERE id = ?', [result.id]);
    res.json({ success: true, message });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST report
app.post('/api/reports', async (req, res) => {
  try {
    const { reportedBy, reportedUser, contentType, reason, description } = req.body;
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO reports (reportedBy, reportedUser, contentType, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
        [reportedBy, reportedUser, contentType, reason, description, 'pending'],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    res.json({ success: true, report: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET all reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await allQuery('SELECT * FROM reports ORDER BY createdAt DESC');
    res.json(reports);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update report
app.put('/api/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    await runQuery('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    
    const report = await getQuery('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    res.json({ success: true, report });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getQuery(`
      SELECT
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE type = 'seeker') as totalSeekers,
        (SELECT COUNT(*) FROM users WHERE type = 'employer') as totalEmployers,
        (SELECT COUNT(*) FROM vacancies WHERE status = 'active') as activeVacancies,
        (SELECT COUNT(*) FROM applications) as totalApplications,
        (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pendingReports
    `);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📊 Database file: data.db');
  console.log('🔗 API endpoints ready');
});
