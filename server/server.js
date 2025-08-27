// server.js
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

if (!process.env.JWT_SECRET) {
  console.error('❌ ОШИБКА: Не задан JWT_SECRET в .env');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: 'Слишком много попыток входа. Попробуйте позже.'
// });
// app.use('/login', limiter);

let db;

const cleanupOldLogs = async () => {
  try {
    const oneMonthAgo = Date.now() - 5 * 86400000; // 30 дней в миллисекундах
    const result = await db.run(`DELETE FROM login_logs WHERE createdAt < ?`, [oneMonthAgo]);
    console.log(`✅ Очищено ${result.changes} старых логов входа`);
  } catch (err) {
    console.error('❌ Ошибка при очистке логов:', err);
  }
};

const startServer = async () => {
  try {
    db = await connectDB();
    if (!db) {
      console.error('❌ connectDB() вернул undefined');
      process.exit(1);
    }
    console.log('✅ База данных подключена и готова к использованию');

    await cleanupOldLogs();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Ошибка при запуске сервера:', err);
    process.exit(1);
  }
};

startServer();

app.get('/', (req, res) => {
  res.redirect('/admin.html');
});

// 🔑 Авторизация (вход)
app.post('/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  const userAgent = req.headers['user-agent'];
  const { email, password } = req.body;

  // Логируем попытку входа (даже если нет body)
  const logAttempt = async (success, userId = null) => {
    try {
      await db.run(
        `INSERT INTO login_logs (userId, email, ip, success, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, ip, success ? 1 : 0, userAgent, Date.now()]
      );
    } catch (err) {
      console.error('❌ Ошибка записи лога входа:', err);
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

    // Проверка лицензии
    const now = Date.now();
    if (user.licenseEndDate <= now) {
      await logAttempt(false, user.id);
      return res.status(403).json({ error: 'Срок вашей лицензии истёк. Обратитесь к администратору.' });
    }

    // ✅ Успешный вход — логируем
    await logAttempt(true, user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: !!user.isAdmin },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isAdmin: !!user.isAdmin,
        licenseLeftDays: Math.ceil((user.licenseEndDate - now) / 86400000)
      }
    });
  } catch (err) {
    await logAttempt(false);
    console.error('❌ Ошибка в /login:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/login-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await db.all(`
        SELECT login_logs.*, users.firstName, users.lastName 
        FROM login_logs 
        LEFT JOIN users ON login_logs.userId = users.id 
        ORDER BY createdAt DESC 
        LIMIT 100
      `);

    const formatted = logs.map(log => ({
      ...log,
      createdAt: new Date(log.createdAt).toLocaleString(),
      success: log.success === 1
    }));

    res.json(formatted);
  } catch (err) {
    console.error('❌ Ошибка в /login-logs:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 📌 Получить всех пользователей
app.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.all(`
        SELECT id, firstName, lastName, phone, email, licenseEndDate, isAdmin 
        FROM users
      `);

    const formatted = users.map(u => {
      const daysLeft = Math.max(0, Math.ceil((u.licenseEndDate - Date.now()) / 86400000));
      return { ...u, licenseDays: daysLeft };
    });

    res.json(formatted);
  } catch (err) {
    console.error('❌ Ошибка в /users:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ➕ Добавить пользователя
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

    // Проверяем, существует ли email
    const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

    const hashed = await bcrypt.hash(password, 10);
    const licenseEndDate = Date.now() + days * 86400000;

    await db.run(
      `INSERT INTO users (firstName, lastName, phone, email, password, licenseEndDate) VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, phone, email, hashed, licenseEndDate]
    );

    console.log(`✅ Админ ${req.user.email} добавил: ${email}`);
    res.json({ success: true, message: `Пользователь ${firstName} добавлен` });
  } catch (err) {
    console.error('❌ Ошибка в /add-user:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

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
    console.error('❌ Ошибка в /delete-user:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put("/update-license/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }

    const { licenseDays } = req.body;
    const days = parseInt(licenseDays);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ error: 'Количество дней должно быть положительным числом' });
    }

    const newDate = Date.now() + days * 86400000;
    const result = await db.run(`UPDATE users SET licenseEndDate = ? WHERE id = ?`, [newDate, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ success: true, message: 'Срок лицензии обновлён' });
  } catch (err) {
    console.error('❌ Ошибка в /update-license:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 👤 Текущий пользователь
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

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isAdmin: !!user.isAdmin,
      licenseEndDate: user.licenseEndDate,
      licenseLeftSeconds,
      licenseLeftDays
    });
  } catch (err) {
    console.error('❌ Ошибка в /users/me:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});