# 📊 Полная архитектура SQL в Found2Work

## 1. ОБЩАЯ СТРУКТУРА

### Что такое SQLite в этом проекте?
- **SQLite** - это встроенная база данных (один файл `data.db`)
- **Размещение**: `c:\Users\User\Documents\Учёба\Work-site\data.db`
- **Функция**: Хранение всех данных приложения (пользователи, вакансии, заявки и т.д.)
- **Почему**: Легко разворачивается, не требует отдельного сервера БД, идеален для проектов

---

## 2. ИНИЦИАЛИЗАЦИЯ DATABASE (server.js строки 24-31)

```javascript
// Подключение к базе данных
const db = new sqlite3.Database('data.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Helper функции для работы с БД
const runQuery = promisify(db.run.bind(db));   // Для INSERT, UPDATE, DELETE
const getQuery = promisify(db.get.bind(db));   // Для SELECT одной записи
const allQuery = promisify(db.all.bind(db));   // Для SELECT множества записей
```

### Что здесь происходит?
1. **sqlite3.Database('data.db')** - открывает или создает файл базы данных
2. **promisify** - преобразует callback-based функции в Promise (для async/await)
3. Три helper функции для разных типов SQL запросов

---

## 3. СХЕМА БАЗЫ ДАННЫХ (5 таблиц)

### Диаграмма связей
```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS TABLE (Пользователи)              │
│  id │ email │ password │ name │ type │ city │ phone │ skills... │
│     │       │          │      │      │      │       │           │
└────────────────────────░───────────────────────░────────────────┘
                         │                       │
                    (FK employerId)         (FK reportedBy/reportedUser)
                         │                       │
    ┌────────────────────┴──────────────┐   ┌───┴──────────────────┐
    │                                   │   │                      │
┌───▼──────────────────────┐    ┌──────▼──▼────────────────┐
│  VACANCIES TABLE         │    │   REPORTS TABLE          │
│  (Вакансии)              │    │   (Жалобы)               │
│  id                      │    │   id                     │
│  employerId (FK)─────────┼────┼──→reportedBy (FK)       │
│  title                   │    │   reportedUser (FK)────┐ │
│  description             │    │   reason               │ │
│  salary                  │    │   status               │ │
│  location                │    │   createdAt            │ │
│  company                 │    └────────────────────────┘ │
│  type                    │                                │
│  requirements            │      ┌─────────────────┐      │
│  status                  │      │   APPLICATIONS  │      │
│  views                   │      │   (Заявки)      │      │
│  applications            │      │   id            │      │
│  createdAt               │      │   userId (FK)───┼──────┘
└────┬──────────────────────      │   vacancyId (FK)
     │                            │   coverLetter
     │                            │   status
     │                            │   createdAt
     │                            └────────┬────────
     │                                     │
     │        ┌────────────────────────────┘
     │        │
     └────────┼───────────────────────────┐
              │                           │
         ┌────▼──────────────────┐  ┌────▼──────────────┐
         │  SAVED_JOBS TABLE     │  │  (друго имя для  │
         │  (Сохраненные вакан.)  │  │   многие-ко-многим)
         │  id                   │  └───────────────────┘
         │  userId (FK)          │
         │  vacancyId (FK)       │
         │  createdAt            │
         └──────────────────────┘
```

---

## 4. ДЕТАЛЬНОЕ ОПИСАНИЕ КАЖДОЙ ТАБЛИЦЫ

### 4.1 ТАБЛИЦА: USERS (линии 36-55 в server.js)

**Назначение**: Хранит всех пользователей системы

```sql
CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,  -- Уникальный ID (1, 2, 3...)
  email             TEXT UNIQUE NOT NULL,               -- Email (должен быть уникален!)
  password          TEXT NOT NULL,                      -- Пароль (в реале нужно хешировать!)
  name              TEXT NOT NULL,                      -- ФИО или название компании
  type              TEXT NOT NULL DEFAULT 'seeker',     -- Тип: 'seeker', 'employer', 'admin'
  city              TEXT,                               -- Город прожива ния/работы
  phone             TEXT,                               -- Телефон (опционально)
  specialization    TEXT,                               -- Специальность (для соискателей)
  experience        TEXT,                               -- Опыт работы (для соискателей)
  about             TEXT,                               -- О себе (биография)
  skills            TEXT,                               -- Навыки через запятую
  resumeFile        BLOB,                               -- Файл резюме (бинарные данные)
  resumeFileName    TEXT,                               -- Имя файла резюме
  companySize       TEXT,                               -- Размер компании (для работодателей)
  industry          TEXT,                               -- Отрасль (для работодателей)
  blocked           INTEGER DEFAULT 0,                  -- Заблокирован ли пользователь (0=нет, 1=да)
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP  -- Дата регистрации
);
```

**Примеры данных**:
```
id | email                | name                | type      | city    | specialization
1  | alex@example.com     | Александр Иванов   | seeker    | Москва  | Frontend Developer
2  | maria@example.com    | Мария Петрова      | seeker    | СПб     | Backend Developer
3  | john@example.com     | John Smith         | seeker    | Moscow  | Full Stack
4  | hr@techcorp.com      | TechCorp HR        | employer  | Москва  | NULL
5  | admin@found2work.com | Admin User         | admin     | Москва  | NULL
```

**Удаленные ключи (Foreign Keys)**: НЕТУ - эта таблица главная
**На что ссылаются**: 
- `VACANCIES.employerId` → `USERS.id`
- `APPLICATIONS.userId` → `USERS.id`
- `SAVED_JOBS.userId` → `USERS.id`
- `REPORTS.reportedBy → USERS.id`
- `REPORTS.reportedUser → USERS.id`

---

### 4.2 ТАБЛИЦА: VACANCIES (линии 58-77 в server.js)

**Назначение**: Хранит все вакансии, которые публикуют работодатели

```sql
CREATE TABLE IF NOT EXISTS vacancies (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  employerId      INTEGER NOT NULL,                     -- ВНЕШНИЙ КЛЮЧ! Кто опубликовал
  title           TEXT NOT NULL,                        -- Название должности
  description     TEXT NOT NULL,                        -- Подробное описание
  salary          TEXT,                                 -- Зарплата (строка для гибкости)
  location        TEXT NOT NULL,                        -- Город или "Удалённо"
  company         TEXT NOT NULL,                        -- Название компании
  type            TEXT NOT NULL DEFAULT 'full-time',    -- full-time, part-time, contract
  requirements    TEXT,                                 -- Требования к кандидату
  status          TEXT NOT NULL DEFAULT 'active',       -- active или closed
  views           INTEGER DEFAULT 0,                    -- Сколько раз смотрели
  applications    INTEGER DEFAULT 0,                    -- Сколько пришло заявок
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,   -- Когда опубликована
  
  FOREIGN KEY (employerId) REFERENCES users(id)         -- Связь с таблицей users
);
```

**Примеры данных**:
```
id | employerId | title                   | salary           | location | company   | status | views
1  | 4          | Senior Frontend Dev     | 150000-180000    | Москва   | TechCorp  | active | 12
2  | 4          | Backend Dev (Node.js)   | 140000-170000    | Москва   | TechCorp  | active | 8
3  | 4          | QA Engineer             | 100000-130000    | Москва   | TechCorp  | active | 5
4  | 4          | DevOps Engineer         | 160000-200000    | Москва   | TechCorp  | active | 3
```

**Вопрос**: Откуда мы знаем, кто опубликовал вакансию #1?
**Ответ**: Смотрим `employerId = 4`, идём в таблицу USERS где `id = 4` → TechCorp HR

**На что ссылаются**:
- `APPLICATIONS.vacancyId` → `VACANCIES.id`
- `SAVED_JOBS.vacancyId` → `VACANCIES.id`

---

### 4.3 ТАБЛИЦА: APPLICATIONS (линии 80-96 в server.js)

**Назначение**: Хранит заявки соискателей на вакансии

```sql
CREATE TABLE IF NOT EXISTS applications (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    INTEGER NOT NULL,                          -- ВНЕШНИЙ КЛЮЧ! Кто подал заявку
  vacancyId INTEGER NOT NULL,                          -- ВНЕШНИЙ КЛЮЧ! На какую вакансию
  
  coverLetter TEXT,                                    -- Письмо-сопровождение (опционально)
  status    TEXT NOT NULL DEFAULT 'pending',           -- pending, accepted, rejected
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,        -- Когда подана заявка
  
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
);
```

**Примеры данных**:
```
id | userId | vacancyId | coverLetter           | status    | createdAt
1  | 1      | 1         | "Я заинтересован..." | pending   | 2026-04-05...
2  | 2      | 2         | "Мне нравится..."    | pending   | 2026-04-05...
3  | 1      | 2         | "Я хочу..."          | accepted  | 2026-04-04...
```

**Вопрос**: На какую вакансию подал заявку пользователь с ID=1 в записи #1?
**Ответ**: На вакансию с `vacancyId = 1` (смотрим VACANCIES):
- Это "Senior Frontend Developer" от TechCorp
- Соискатель: `userId = 1` (Александр Иванов)

---

### 4.4 ТАБЛИЦА: SAVED_JOBS (линии 99-110 в server.js)

**Назначение**: Связь "много-ко-многим" для сохраненных вакансий

```sql
CREATE TABLE IF NOT EXISTS saved_jobs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    INTEGER NOT NULL,                          -- ВНЕШНИЙ КЛЮЧ!
  vacancyId INTEGER NOT NULL,                          -- ВНЕШНИЙ КЛЮЧ!
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,        -- Когда сохранена
  
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
);
```

**Примеры данных**:
```
id | userId | vacancyId | createdAt
1  | 1      | 1         | 2026-04-05...
2  | 1      | 3         | 2026-04-05...
3  | 2      | 2         | 2026-04-04...
```

**Вопрос**: Какие вакансии сохранил пользователь #1?
**Ответ**: 
- Вакансия #1 (Senior Frontend Dev)
- Вакансия #3 (QA Engineer)

---

### 4.5 ТАБЛИЦА: REPORTS (линии 113-131 в server.js)

**Назначение**: Система жалоб и модерации

```sql
CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reportedBy  INTEGER NOT NULL,                        -- ВНЕШНИЙ КЛЮЧ! Кто пожаловался
  reportedUser INTEGER,                                -- ВНЕШНИЙ КЛЮЧ! На кого жалоба (опционально)
  contentType TEXT,                                    -- Тип контента (user, vacancy, comment)
  reason      TEXT NOT NULL,                           -- Причина (spam, abuse, inappropriate)
  description TEXT,                                    -- Подробное описание
  status      TEXT NOT NULL DEFAULT 'pending',         -- pending, reviewed, resolved
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reportedBy) REFERENCES users(id),
  FOREIGN KEY (reportedUser) REFERENCES users(id)
);
```

**Примеры данных**:
```
id | reportedBy | reportedUser | reason   | status    | createdAt
1  | 1          | 2            | spam     | pending   | 2026-04-05...
2  | 3          | NULL         | abuse    | reviewed  | 2026-04-01...
```

---

## 5. SQL QUERIES - ПРИМЕРЫ ИЗ КОДА

### 5.1 ЗАГРУЗКА ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
```javascript
// API endpoint: GET /api/users
app.get('/api/users', async (req, res) => {
  const users = await allQuery('SELECT id, email, name, type, city, specialization, experience FROM users');
  res.json(users);
});
```

**SQL Query** (что выполняется в БД):
```sql
SELECT id, email, name, type, city, specialization, experience FROM users
```

**Результат**: Массив всех пользователей, но БЕЗ пароля и приватных данных (защита!)

---

### 5.2 ВХОД ПОЛЬЗОВАТЕЛЯ (LOGIN)
```javascript
// API endpoint: POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await getQuery('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ success: true, user });
});
```

**SQL Query**:
```sql
SELECT * FROM users 
WHERE email = 'alex@example.com' AND password = 'password123'
```

**Параметры** (`?` - это placeholder):
- Параметр 1: email = 'alex@example.com'
- Параметр 2: password = 'password123'

**Защита от SQL Injection**:
- ❌ НЕПРАВИЛЬНО: `'WHERE email = ' + email + ...` (опасно!)
- ✅ ПРАВИЛЬНО: `'WHERE email = ? AND password = ?', [email, password]` (безопасно!)

---

### 5.3 СОЗДАНИЕ НОВОЙ ВАКАНСИИ
```javascript
// API endpoint: POST /api/vacancies
app.post('/api/vacancies', async (req, res) => {
  const { employerId, title, description, salary, location, company, type, requirements } = req.body;
  
  const result = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO vacancies (employerId, title, description, salary, location, company, type, requirements, status, views, applications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [employerId, title, description, salary, location, company, type, requirements, 'active', 0, 0],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, employerId, title, description, salary, location, company, type, requirements, status: 'active' });
      }
    );
  });

  res.json({ success: true, vacancy: result });
});
```

**SQL Query**:
```sql
INSERT INTO vacancies (employerId, title, description, salary, location, company, type, requirements, status, views, applications) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Пример реальных данных**:
```sql
INSERT INTO vacancies (employerId, title, description, salary, location, company, type, requirements, status, views, applications)
VALUES (4, 'Senior Frontend Developer', 'Ищем опытного...', '150000-180000', 'Москва', 'TechCorp', 'full-time', 'React, TypeScript...', 'active', 0, 0)
```

**Возвращаемое значение**: `this.lastID` - ID новой созданной вакансии (например, 15)

---

### 5.4 ПОДАЧА ЗАЯВКИ НА ВАКАНСИЮ
```javascript
// API endpoint: POST /api/applications
app.post('/api/applications', async (req, res) => {
  const { userId, vacancyId, coverLetter } = req.body;
  
  // Проверка: не подал ли уже
  const existingApp = await getQuery('SELECT * FROM applications WHERE userId = ? AND vacancyId = ?', [userId, vacancyId]);
  if (existingApp) {
    return res.status(400).json({ error: 'Already applied to this vacancy' });
  }

  // Вставляем новую заявку
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

  // Увеличиваем счетчик заявок на вакансию
  await runQuery('UPDATE vacancies SET applications = applications + 1 WHERE id = ?', [vacancyId]);

  res.json({ success: true, application: result });
});
```

**SQL Queries** (три штуки):
```sql
-- 1. Проверяем существует ли уже
SELECT * FROM applications 
WHERE userId = 1 AND vacancyId = 1

-- 2. Вставляем новую заявку
INSERT INTO applications (userId, vacancyId, coverLetter, status) 
VALUES (1, 1, 'Я заинтересован...', 'pending')

-- 3. Обновляем счетчик
UPDATE vacancies 
SET applications = applications + 1 
WHERE id = 1
```

**Результат**: После операции вакансия #1 теперь имеет 1 заявку (applications = 1)

---

### 5.5 ПОЛУЧЕНИЕ ВАКАНСИЙ РАБОТОДАТЕЛЯ
```javascript
// API endpoint: GET /api/vacancies/employer/:id
app.get('/api/vacancies/employer/:id', async (req, res) => {
  const vacancies = await allQuery('SELECT * FROM vacancies WHERE employerId = ? ORDER BY createdAt DESC', [req.params.id]);
  res.json(vacancies);
});
```

**SQL Query**:
```sql
SELECT * FROM vacancies 
WHERE employerId = 4 
ORDER BY createdAt DESC
```

**ORDER BY createdAt DESC**:
- Сортирует по дате создания
- DESC = "Descending" (новые сверху)
- ASC = "Ascending" (старые сверху)

**Результат**: Все вакансии компании TechCorp, самые новые первыми

---

### 5.6 ЗАГРУЗКА ЗАЯВОК ДЛЯ СОИСКАТЕЛЯ
```javascript
// API endpoint: GET /api/applications/user/:id
app.get('/api/applications/user/:id', async (req, res) => {
  const applications = await allQuery('SELECT * FROM applications WHERE userId = ? ORDER BY createdAt DESC', [req.params.id]);
  res.json(applications);
});
```

**SQL Query**:
```sql
SELECT * FROM applications 
WHERE userId = 1 
ORDER BY createdAt DESC
```

**Результат**: У Александра (ID=1) есть 2 заявки, новые первыми

---

### 5.7 СТАТИСТИКА ПЛАТФОРМЫ
```javascript
// API endpoint: GET /api/stats
app.get('/api/stats', async (req, res) => {
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
});
```

**SQL Query** (вложенные запросы):
```sql
SELECT
  (SELECT COUNT(*) FROM users) as totalUsers,
  (SELECT COUNT(*) FROM users WHERE type = 'seeker') as totalSeekers,
  (SELECT COUNT(*) FROM users WHERE type = 'employer') as totalEmployers,
  (SELECT COUNT(*) FROM vacancies WHERE status = 'active') as activeVacancies,
  (SELECT COUNT(*) FROM applications) as totalApplications,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pendingReports
```

**Результат**:
```json
{
  "totalUsers": 5,
  "totalSeekers": 3,
  "totalEmployers": 1,
  "activeVacancies": 4,
  "totalApplications": 3,
  "pendingReports": 1
}
```

---

## 6. ЖИЗНЕННЫЙ ЦИКЛ ДАННЫХ (Пример: подача заявки)

### Сценарий: Александр применяет на вакансию Senior Frontend Dev

#### Шаг 1: Frontend отправляет запрос
```javascript
// В UserDashboard.jsx
const result = await applyForVacancy(1, 1, 'Я заинтересован...')
```

#### Шаг 2: Backend получает запрос
```javascript
// server.js
app.post('/api/applications', async (req, res) => {
  const { userId, vacancyId, coverLetter } = req.body;
  // userId = 1 (Александр)
  // vacancyId = 1 (Senior Frontend Developer)
  // coverLetter = 'Я заинтересован...'
```

#### Шаг 3: Проверка в БД
```sql
SELECT * FROM applications 
WHERE userId = 1 AND vacancyId = 1
-- Результат: Ничего (он еще не подавал)
```

#### Шаг 4: Вставка в БД
```sql
INSERT INTO applications (userId, vacancyId, coverLetter, status) 
VALUES (1, 1, 'Я заинтересован...', 'pending')
-- Нова заявка получает ID (например, 4)
```

#### Шаг 5: Обновление счетчика
```sql
UPDATE vacancies 
SET applications = applications + 1 
WHERE id = 1
-- vacancies #1 теперь имеет applications = 1 (был 0)
```

#### Шаг 6: Ответ фронтенду
```json
{
  "success": true,
  "application": {
    "id": 4,
    "userId": 1,
    "vacancyId": 1,
    "coverLetter": "Я заинтересован...",
    "status": "pending"
  }
}
```

#### Шаг 7: Frontend показывает уведомление
```javascript
showNotification('✓ Спасибо! Ваша заявка успешно отправлена', 'success')
```

---

## 7. ТИПЫ ДАННЫХ В SQLITE

| Тип      | Примеры                      | Когда использовать                |
|----------|------------------------------|-----------------------------------|
| INTEGER  | 1, 100, -5                  | ID, счетчики, цены              |
| TEXT     | 'hello', 'user@mail.com'     | Строки, текст                   |
| REAL     | 3.14, 2.5                   | Числа с десятичной частью       |
| BLOB     | (двоичные данные)            | Файлы, изображения              |
| DATETIME | '2026-04-05 15:30:00'        | Даты и время                    |

**В нашем проекте**:
- `resumeFile BLOB` - бинарные данные файла резюме
- `id INTEGER PRIMARY KEY AUTOINCREMENT` - автоматически увеличивающиеся ID

---

## 8. КЛЮЧЕВЫЕ КОНЦЕПЦИИ

### PRIMARY KEY
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
```
- Уникальный идентификатор каждой записи
- Автоматически увеличивается (1, 2, 3, ...)
- Не может быть NULL или дублирован

### FOREIGN KEY (Внешний ключ)
```sql
employerId INTEGER NOT NULL,
...
FOREIGN KEY (employerId) REFERENCES users(id)
```
- Связывает таблицы между собой
- `employerId` в VACANCIES указывает на `id` в USERS
- Обеспечивает целостность данных

### UNIQUE
```sql
email TEXT UNIQUE NOT NULL
```
- Каждое значение должно быть уникальным
- В нашем проекте: каждый email уникален

### DEFAULT
```sql
type TEXT NOT NULL DEFAULT 'seeker'
status TEXT NOT NULL DEFAULT 'active'
blocked INTEGER DEFAULT 0
```
- Задает значение по умолчанию
- Если не указано, используется default

---

## 9. ВАЖНЫЕ ЗАПРОСЫ И ИХ ОБЪЯСНЕНИЕ

### WHERE - Фильтрация
```sql
-- Найти всех пользователей из Москвы
SELECT * FROM users WHERE city = 'Москва'

-- Найти все активные вакансии
SELECT * FROM vacancies WHERE status = 'active'

-- Найти все заявки пользователя 1
SELECT * FROM applications WHERE userId = 1
```

### ORDER BY - Сортировка
```sql
-- Самые новые первыми
SELECT * FROM vacancies ORDER BY createdAt DESC

-- По названию от А до Z
SELECT * FROM users ORDER BY name ASC
```

### COUNT - Подсчет
```sql
-- Сколько пользователей?
SELECT COUNT(*) FROM users  -- Результат: 5

-- Сколько вакансий у работодателя 4?
SELECT COUNT(*) FROM vacancies WHERE employerId = 4  -- Результат: 4

-- Сколько активных вакансий?
SELECT COUNT(*) FROM vacancies WHERE status = 'active'  -- Результат: 4
```

### GROUP BY - Группировка
```sql
-- Сколько заявок по каждой вакансии?
SELECT vacancyId, COUNT(*) as applicationCount 
FROM applications 
GROUP BY vacancyId
-- Результат:
-- vacancyId | applicationCount
--       1   |         2
--       2   |         1
```

---

## 10. ЗАЩИТА ДАННЫХ

### Parameterized Queries (Безопасно ✅)
```javascript
const username = req.body.email; // 'test@mail.com'
const password = req.body.password; // 'pass123'

// БЕЗОПАСНО: параметры отделены от SQL
db.run('SELECT * FROM users WHERE email = ? AND password = ?', 
       [username, password])
```

### String Concatenation (Опасно ❌)
```javascript
// ОПАСНО: можно сделать SQL Injection
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`
// Если email = "' OR '1'='1", выполнится: 
// SELECT * FROM users WHERE email = '' OR '1'='1'  (вернёт всех!)
```

---

## 11. ЗАПУСК И ПРОСМОТР БД

### Установка DB Browser for SQLite
1. Скачать: https://sqlitebrowser.org/
2. Откр ыть файл: `c:\Users\User\Documents\Учёба\Work-site\data.db`
3. Смотреть структуру и данные

### Просмотр в консоли Node.js
```bash
sqlite3 data.db
.tables  # Список всех таблиц
.schema users  # Структура таблицы
SELECT * FROM users;  # Содержимое
.quit  # Выход
```

---

## 12. ПОТЕНЦИАЛЬНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема 1: Пароли в открытом виде
```
❌ ТЕКУЩЕЕ: password TEXT - хранится открытым текстом
✅ РЕШЕНИЕ: Использовать bcrypt для хеширования
```

### Проблема 2: Нет ограничений на размер файлов
```
❌ ТЕКУЩЕЕ: resumeFile BLOB может быть огромным
✅ РЕШЕНИЕ: Добавить проверку размера (max 5MB)
```

### Проблема 3: Нет индексов для поиска
```
❌ МЕДЛЕННО: SELECT * FROM users WHERE email = '...'
✅ РЕШЕНИЕ: CREATE INDEX idx_user_email ON users(email);
```

---

## ИТОГОВАЯ АРХИТЕКТУРА FLOW

```
Frontend (React)
    ↓
HTTP Request (GET /api/vacancies)
    ↓
Express Server (server.js)
    ↓
SQLite Database (data.db)
    ↓ 
SQL Query: SELECT * FROM vacancies WHERE status = 'active'
    ↓
Результат: 4 вакансии
    ↓
Express возвращает JSON
    ↓
Frontend получает и отображает
    ↓
Пользователь видит вакансии на экране
```

---

## ЗАКЛЮЧЕНИЕ

Found2Work использует **SQLite** для:
✅ Хранения всех данных (5 таблиц)
✅ Связей между данными (FOREIGN KEY)
✅ Подсчета статистики (COUNT, GROUP BY)
✅ Фильтрации и сортировки
✅ Защиты от SQL Injection (parameterized queries)

Это простая но мощная архитектура, идеальная для среднего проекта!
