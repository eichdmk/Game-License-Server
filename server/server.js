// server.js
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

let db;

const startServer = async () => {
  try {
    db = await connectDB();
    if (!db) {
      console.error('❌ connectDB() вернул undefined');
      return;
    }
    console.log('✅ База данных подключена и готова к использованию');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Ошибка при запуске сервера:', err);
  }
};

startServer();

app.get('/', (req, res) => {
  res.redirect('/admin.html');
});

// 🔑 Авторизация
app.post('/login', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'База данных не подключена' });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Введите логин и пароль' });

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ error: 'Неверный логин или пароль' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Неверный логин или пароль' });

    // 🔒 Проверка лицензии перед выдачей токена
    const now = Date.now();
    if (user.licenseEndDate <= now) {
      return res.status(403).json({ error: 'Срок вашей лицензии истёк. Обратитесь к администратору.' });
    }

    // Создаём JWT-токен
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET
    );

    res.json({
      token,
      user: { username: user.username, isAdmin: user.isAdmin }
    });
  } catch (err) {
    console.error('❌ Ошибка в /login:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 📌 Получить всех пользователей
app.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  const users = await db.all(
    "SELECT id, username, licenseEndDate, isAdmin FROM users"
  );

  const formatted = users.map((u) => {
    const daysLeft = Math.max(
      0,
      Math.ceil((u.licenseEndDate - Date.now()) / (1000 * 60 * 60 * 24))
    );
    return { ...u, licenseDays: daysLeft };
  });

  res.json(formatted);
});

// ➕ Добавить пользователя
app.post("/add-user", authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, licenseDays } = req.body;

  if (!username || !password || !licenseDays) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const licenseEndDate = Date.now() + licenseDays * 24 * 60 * 60 * 1000;

  try {
    await db.run(
      `INSERT INTO users (username, password, licenseEndDate) VALUES (?, ?, ?)`,
      [username, hashed, licenseEndDate]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Пользователь уже существует" });
  }
});

// ✅ Удаление пользователя
app.delete("/delete-user/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.run(`DELETE FROM users WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({ success: true, message: "Пользователь удалён" });
  } catch (err) {
    console.error("❌ Ошибка удаления:", err);
    res.status(500).json({ error: "Ошибка удаления" });
  }
});

// 👤 Текущий пользователь
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    // req.user заполняется в authenticateToken из jwt.verify(...)
    const user = await db.get(
      'SELECT id, username, isAdmin, licenseEndDate FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const now = Date.now();
    const licenseLeftSeconds = Math.max(0, Math.floor((user.licenseEndDate - now) / 1000));
    const licenseLeftDays = Math.ceil(licenseLeftSeconds / 86400);

    res.json({
      id: user.id,
      username: user.username,
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



// ✅ Обновление срока лицензии
app.put("/update-license/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { licenseDays } = req.body;

  // if (!licenseDays || isNaN(licenseDays)) {
  //   return res.status(400).json({ error: "Введите корректное количество дней" });
  // }

  try {
    const newDate = Date.now() + licenseDays * 24 * 60 * 60 * 1000;

    const result = await db.run(
      `UPDATE users SET licenseEndDate = ? WHERE id = ?`,
      [newDate, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({ success: true, message: "Срок лицензии обновлён" });
  } catch (err) {
    console.error("❌ Ошибка обновления лицензии:", err);
    res.status(500).json({ error: "Ошибка обновления лицензии" });
  }
});
