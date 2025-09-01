// server.js
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { blockIPMiddleware } from './middleware/blockIP.js'; // ← НОВЫЙ ИМПОРТ
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from "crypto";

// Проверка JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('ОШИБКА: Не задан JWT_SECRET в .env');
  process.exit(1);
}

// Проверка LICENSE_SIGNING_SECRET
if (!process.env.LICENSE_SIGNING_SECRET) {
  console.error('ОШИБКА: Не задан LICENSE_SIGNING_SECRET в .env');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();

// --- 🔐 ДОБАВЛЯЕМ МИДЛВЕР ДЛЯ БЛОКИРОВКИ IP (ДО ВСЕХ МАРШРУТОВ) ---
app.use(blockIPMiddleware);
// ---------------------------------------------------------------

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Лимит попыток входа
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Слишком много попыток входа. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/login', limiter);

function createLicenseSignature(userId, licenseEndDate) {
  const data = `${userId}:${licenseEndDate}`;
  return crypto
    .createHmac("sha256", process.env.LICENSE_SIGNING_SECRET || "default_secret")
    .update(data)
    .digest("hex");
}

let db;

// Очистка старых логов
const cleanupOldLogs = async () => {
  try {
    const oneMonthAgo = Date.now() - 30 * 86400000;
    const result = await db.run(`DELETE FROM login_logs WHERE createdAt < ?`, [oneMonthAgo]);
    console.log(`🧹 Очищено ${result.changes} старых логов входа`);
  } catch (err) {
    console.error('Ошибка при очистке логов:', err);
  }
};

// Запуск сервера
const startServer = async () => {
  try {
    db = await connectDB();
    if (!db) {
      console.error('connectDB() вернул undefined');
      process.exit(1);
    }
    console.log('База данных подключена');

    await cleanupOldLogs();
    setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); 

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка при запуске сервера:', err);
    process.exit(1);
  }
};

startServer();

// --- 🔒 ЭНДПОИНТЫ ДЛЯ УПРАВЛЕНИЯ IP-БЛОКИРОВКАМИ (ТОЛЬКО ДЛЯ АДМИНА) ---

// Заблокировать IP
app.post('/admin/block-ip', authenticateToken, requireAdmin, async (req, res) => {
  const { ip, reason, days } = req.body;

  if (!ip) {
    return res.status(400).json({ error: 'IP обязателен' });
  }

  const expiresAt = days ? Date.now() + days * 86400000 : null;

  try {
    await db.run(
      `INSERT OR REPLACE INTO blocked_ips (ip, reason, blockedAt, expiresAt) VALUES (?, ?, ?, ?)`,
      [ip, reason || 'не указана', Date.now(), expiresAt]
    );

    console.log(`Админ ${req.user.email} заблокировал IP: ${ip}`);
    res.json({ success: true, message: `IP ${ip} заблокирован` });
  } catch (err) {
    console.error('Ошибка блокировки IP:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Разблокировать IP
app.delete('/admin/unblock-ip/:ip', authenticateToken, requireAdmin, async (req, res) => {
  const ip = decodeURIComponent(req.params.ip);

  try {
    const result = await db.run(`DELETE FROM blocked_ips WHERE ip = ?`, [ip]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'IP не найден в блокировке' });
    }
    res.json({ success: true, message: `IP ${ip} разблокирован` });
  } catch (err) {
    console.error('Ошибка разблокировки IP:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить список заблокированных IP
app.get('/admin/blocked-ips', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const blocked = await db.all(`SELECT * FROM blocked_ips ORDER BY blockedAt DESC`);
    res.json(blocked);
  } catch (err) {
    console.error('Ошибка получения списка IP:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Экспорт пользователей (CSV)
app.get('/export-users', authenticateToken, requireAdmin, async (req, res) => {
  const format = req.query.format || 'csv';
  
  try {
    const users = await db.all(`
      SELECT 
        id, 
        firstName, 
        lastName, 
        phone, 
        email, 
        licenseEndDate,
        CASE 
          WHEN licenseEndDate > ? THEN 'active' 
          ELSE 'expired' 
        END as status
      FROM users
    `, [Date.now()]);

    if (format === 'csv') {
      // Генерируем CSV
      const csv = [
        ['ID', 'Имя', 'Фамилия', 'Телефон', 'Email', 'Дата окончания', 'Статус'].join(','),
        ...users.map(u => [
          u.id,
          `"${u.firstName}"`,
          `"${u.lastName}"`,
          `"${u.phone || ''}"`,
          `"${u.email}"`,
          `"${new Date(u.licenseEndDate).toLocaleDateString()}"`,
          u.status
        ].join(','))
      ].join('\n');

      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=users_export.csv');
      res.send(csv);
    } 
    else if (format === 'json') {
      res.json(users);
    } 
    else {
      res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
  } catch (err) {
    console.error('Ошибка экспорта:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- 🛡 ВХОД И ВЫДАЧА ДАННЫХ ДЛЯ ОФФЛАЙН-РЕЖИМА ---
app.post('/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  const userAgent = req.headers['user-agent'];
  const { email, password } = req.body;

  const logAttempt = async (success, userId = null) => {
    try {
      await db.run(
        `INSERT INTO login_logs (userId, email, ip, success, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, ip, success ? 1 : 0, userAgent, Date.now()]
      );
    } catch (err) {
      console.error('Ошибка записи лога входа:', err);
    }
  };

  try {
    if (!db) return res.status(500).json({ error: 'База данных не подключена' });
    if (!email || !password) {
      await logAttempt(false);
      return res.status(400).json({ error: 'Введите email и пароль' });
    }

    console.log('🔐 Попытка входа:', email, 'с IP:', ip);

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await logAttempt(false);
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await logAttempt(false, user.id);
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const now = Date.now();
    if (user.licenseEndDate <= now) {
      await logAttempt(false, user.id);
      return res.status(403).json({ 
        error: 'Срок вашей лицензии истёк. Обратитесь к администратору.' 
      });
    }

    await logAttempt(true, user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Подготавливаем данные для оффлайн-режима
    const licenseData = {
      userId: user.id,
      email: user.email,
      licenseEndDate: user.licenseEndDate,
      issuedAt: now
    };

    const signature = createLicenseSignature(user.id, user.licenseEndDate);

    res.json({
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isAdmin: !!user.isAdmin,
        licenseLeftDays: Math.ceil((user.licenseEndDate - now) / 86400000)
      },
      offlineLicense: licenseData,
      licenseSignature: signature
    });
  } catch (err) {
    await logAttempt(false);
    console.error('Ошибка в /login:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

//  Личный кабинет (с данными для оффлайн) ---
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, firstName, lastName, email, phone, isAdmin, licenseEndDate FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const now = Date.now();
    const licenseLeftSeconds = Math.max(0, Math.floor((user.licenseEndDate - now) / 1000));
    const licenseLeftDays = Math.ceil(licenseLeftSeconds / 86400);

    const licenseData = {
      userId: user.id,
      email: user.email,
      licenseEndDate: user.licenseEndDate,
      issuedAt: now
    };

    const signature = createLicenseSignature(user.id, user.licenseEndDate);

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isAdmin: !!user.isAdmin,
      licenseEndDate: user.licenseEndDate,
      licenseLeftSeconds,
      licenseLeftDays,
      offlineLicense: licenseData,
      licenseSignature: signature
    });
  } catch (err) {
    console.error('Ошибка в /users/me:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

//  Проверка лицензии (для обновления оффлайн-данных) 
app.get('/check-license', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, email, licenseEndDate FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const now = Date.now();
    const isActive = user.licenseEndDate > now;

    const licenseData = {
      userId: user.id,
      email: user.email,
      licenseEndDate: user.licenseEndDate,
      issuedAt: now
    };

    const signature = createLicenseSignature(user.id, user.licenseEndDate);

    res.json({
      isActive,
      daysLeft: isActive ? Math.ceil((user.licenseEndDate - now) / 86400000) : 0,
      licenseEndDate: user.licenseEndDate,
      offlineLicense: licenseData,
      licenseSignature: signature
    });
  } catch (err) {
    console.error('Ошибка в /check-license:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


// Все пользователи
app.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT id, firstName, lastName, phone, email, licenseEndDate, isAdmin 
      FROM users
    `);
    const formatted = users.map(u => ({
      ...u,
      licenseDays: Math.max(0, Math.ceil((u.licenseEndDate - Date.now()) / 86400000))
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Ошибка в /users:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить пользователя
app.post("/add-user", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, licenseDays } = req.body;
    if (!firstName || !lastName || !email || !password || !licenseDays) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const days = parseInt(licenseDays);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ error: 'Количество дней должно быть положительным числом' });
    }

    const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

    const hashed = await bcrypt.hash(password, 10);
    const licenseEndDate = Date.now() + days * 86400000;

    await db.run(
      `INSERT INTO users (firstName, lastName, phone, email, password, licenseEndDate) VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, phone, email, hashed, licenseEndDate]
    );

    console.log(`Админ ${req.user.email} добавил: ${email}`);
    res.json({ success: true, message: `Пользователь ${firstName} добавлен` });
  } catch (err) {
    console.error('Ошибка в /add-user:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить пользователя
app.delete("/delete-user/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const result = await db.run(`DELETE FROM users WHERE id = ?`, [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ success: true, message: 'Пользователь удалён' });
  } catch (err) {
    console.error('Ошибка в /delete-user:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить лицензию
app.put("/update-license/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const { licenseDays } = req.body;
    const days = parseInt(licenseDays);
    if (isNaN(days) || days < 0) {
      return res.status(400).json({ error: 'Количество дней должно быть положительным числом' });
    }
    const newDate = Date.now() + days * 86400000;
    const result = await db.run(`UPDATE users SET licenseEndDate = ? WHERE id = ?`, [newDate, id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ success: true, message: 'Срок лицензии обновлён' });
  } catch (err) {
    console.error('Ошибка в /update-license:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Карточка пользователя + логи
app.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const user = await db.get(
      `SELECT id, firstName, lastName, phone, email, licenseEndDate, isAdmin FROM users WHERE id = ?`,
      [id]
    );
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const logs = await db.all(
      `SELECT id, email, ip, success, userAgent, createdAt FROM login_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
      [id]
    );

    const formattedLogs = logs.map(log => ({
      ...log,
      createdAt: new Date(log.createdAt).toLocaleString(),
      success: log.success === 1
    }));

    res.json({
      ...user,
      licenseDays: Math.max(0, Math.ceil((user.licenseEndDate - Date.now()) / 86400000)),
      logs: formattedLogs
    });
  } catch (err) {
    console.error('Ошибка в /users/:id:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статистика по лицензиям (только для админа)
app.get('/license-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Общая статистика
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const activeUsers = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE licenseEndDate > ?
    `, [Date.now()]);
    
    const expiredUsers = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE licenseEndDate <= ?
    `, [Date.now()]);
    
    // Распределение по дням
    const licenseDistribution = await db.all(`
      SELECT 
        CASE 
          WHEN licenseEndDate - ? < 86400000 THEN 'less_1d'
          WHEN licenseEndDate - ? < 3 * 86400000 THEN '1-3d'
          WHEN licenseEndDate - ? < 7 * 86400000 THEN '3-7d'
          WHEN licenseEndDate - ? < 30 * 86400000 THEN '7-30d'
          ELSE 'more_30d'
        END as period,
        COUNT(*) as count
      FROM users
      WHERE licenseEndDate > ?
      GROUP BY period
    `, [Date.now(), Date.now(), Date.now(), Date.now(), Date.now()]);

    // Новые пользователи за неделю
    const newUsersLastWeek = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE licenseEndDate > ?
    `, [Date.now() - 7 * 86400000]);

    // Средний срок лицензии
    const avgLicenseDays = await db.get(`
      SELECT AVG((licenseEndDate - ?) / 86400000) as avgDays 
      FROM users 
      WHERE licenseEndDate > ?
    `, [Date.now(), Date.now()]);

    // Прогноз оттока
    const expiringSoon = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE licenseEndDate BETWEEN ? AND ?
    `, [Date.now(), Date.now() + 3 * 86400000]);

    res.json({
      total: totalUsers.count,
      active: activeUsers.count,
      expired: expiredUsers.count,
      distribution: licenseDistribution.reduce((acc, item) => {
        acc[item.period] = item.count;
        return acc;
      }, {}),
      newUsersLastWeek: newUsersLastWeek.count,
      avgLicenseDays: avgLicenseDays.avgDays || 0,
      expiringSoon: expiringSoon.count
    });
  } catch (err) {
    console.error('Ошибка в /license-stats:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Все логи входов (для админа)
app.get('/login-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await db.all(`
      SELECT 
        ll.id, ll.email, ll.ip, ll.success, ll.userAgent, ll.createdAt,
        u.firstName, u.lastName
      FROM login_logs ll
      LEFT JOIN users u ON ll.userId = u.id
      ORDER BY ll.createdAt DESC
      LIMIT 100
    `);

    const formatted = logs.map(log => ({
      ...log,
      createdAt: new Date(log.createdAt).toLocaleString(),
      success: log.success === 1
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Ошибка в /login-logs:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});