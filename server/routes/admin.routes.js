import express from 'express';
import bcrypt from 'bcrypt';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
const router = express.Router();

let db;

export const setDependencies = (database) => {
  db = database;
};

//IP БЛОКИРОВКИ 

router.post('/block-ip', authenticateToken, requireAdmin, async (req, res) => {
  const { ip, reason, days } = req.body;

  if (!ip) {
    return res.status(400).json({ error: 'IP обязателен' });
  }

  const expiresAt = days ? Date.now() + days * 86400000 : null;

  try {
    await db.run(
      `INSERT INTO blocked_ips (ip, reason, blockedAt, expiresAt) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (ip) DO UPDATE 
       SET reason = EXCLUDED.reason, blockedAt = EXCLUDED.blockedAt, expiresAt = EXCLUDED.expiresAt`,
      [ip, reason || 'не указана', Date.now(), expiresAt]
    );

    console.log(`Админ ${req.user.email} заблокировал IP: ${ip}`);
    res.json({ success: true, message: `IP ${ip} заблокирован` });
  } catch (err) {
    console.error('Ошибка блокировки IP:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/unblock-ip/:ip', authenticateToken, requireAdmin, async (req, res) => {
  const ip = decodeURIComponent(req.params.ip);

  try {
    const result = await db.run(`DELETE FROM blocked_ips WHERE ip = $1`, [ip]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'IP не найден в блокировке' });
    }
    res.json({ success: true, message: `IP ${ip} разблокирован` });
  } catch (err) {
    console.error('Ошибка разблокировки IP:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/blocked-ips', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const blocked = await db.all(`SELECT * FROM blocked_ips ORDER BY blockedAt DESC`);
    res.json(blocked);
  } catch (err) {
    console.error('Ошибка получения списка IP:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- ПОЛЬЗОВАТЕЛИ ---

router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT id, firstName, lastName, phone, email, licenseEndDate, isadmin AS "isAdmin"
      FROM users
    `);
    const formatted = users.map(u => ({
      ...u,
      licenseDays: Math.max(0, Math.ceil((u.licenseenddate - Date.now()) / 86400000))
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Ошибка в /users:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post("/add-user", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, licenseDays } = req.body;
    if (!firstName || !lastName || !email || !password || !licenseDays) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const days = parseInt(licenseDays);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ error: 'Количество дней должно быть положительным числом' });
    }

    const existing = await db.get('SELECT * FROM users WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

    const hashed = await bcrypt.hash(password, 10);
    const licenseEndDate = Date.now() + days * 86400000;

    await db.run(
      `INSERT INTO users (firstName, lastName, phone, email, password, licenseEndDate) VALUES ($1, $2, $3, $4, $5, $6)`,
      [firstName, lastName, phone, email, hashed, licenseEndDate]
    );

    console.log(`Админ ${req.user.email} добавил: ${email}`);
    res.json({ success: true, message: `Пользователь ${firstName} добавлен` });
  } catch (err) {
    console.error('Ошибка в /add-user:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete("/delete-user/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const result = await db.run(`DELETE FROM users WHERE id = $1`, [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ success: true, message: 'Пользователь удалён' });
  } catch (err) {
    console.error('Ошибка в /delete-user:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put("/update-license/:id", authenticateToken, requireAdmin, async (req, res) => {
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
    const result = await db.run(`UPDATE users SET licenseEndDate = $1 WHERE id = $2`, [newDate, id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ success: true, message: 'Срок лицензии обновлён' });
  } catch (err) {
    console.error('Ошибка в /update-license:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const user = await db.get(
      `SELECT id, firstName, lastName, phone, email, licenseEndDate, isadmin AS "isAdmin" FROM users WHERE id = $1`,
      [id]
    );
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const logs = await db.all(
      `SELECT id, email, ip, success, userAgent, createdAt FROM login_logs WHERE userId = $1 ORDER BY createdAt DESC LIMIT 50`,
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

// --- СТАТИСТИКА ---
router.get('/license-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = BigInt(Date.now());

    const totalUsersRes = await db.get('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersRes.count, 10); // ← ЧИСЛО!

    const activeUsersRes = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE licenseEndDate > $1',
      [now.toString()]
    );
    const expiredUsersRes = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE licenseEndDate <= $1',
      [now.toString()]
    );
    const activeUsers = parseInt(activeUsersRes.count, 10); // ← ЧИСЛО!
    const expiredUsers = parseInt(expiredUsersRes.count, 10); // ← ЧИСЛО!

    const users = await db.all(
      'SELECT licenseEndDate FROM users WHERE licenseEndDate > $1',
      [now.toString()]
    );

    const distribution = {
      less_1d: 0,
      '1-3d': 0,
      '3-7d': 0,
      '7-30d': 0,
      more_30d: 0,
    };

    let totalLicenseDays = 0;
    let expiringSoon = 0;

    users.forEach(u => {
      // ИСПРАВЛЕНО: licenseenddate вместо licenseEndDate
      if (!u.licenseenddate) return;

      const licenseEnd = BigInt(u.licenseenddate); // ← ИСПРАВЛЕНО
      const daysLeft = Number((licenseEnd - now) / 86400000n);

      if (isNaN(daysLeft)) return;

      totalLicenseDays += daysLeft;

      if (daysLeft < 1) distribution.less_1d++;
      else if (daysLeft < 3) distribution['1-3d']++;
      else if (daysLeft < 7) distribution['3-7d']++;
      else if (daysLeft < 30) distribution['7-30d']++;
      else distribution.more_30d++;

      if (daysLeft >= 0 && daysLeft <= 3) expiringSoon++;
    });

    const avgLicenseDays = users.length > 0 ? totalLicenseDays / users.length : 0;

    const newUsersLastWeek = totalUsers; // ← временно

    res.json({
      total: totalUsers,
      active: activeUsers,
      expired: expiredUsers,
      distribution,
      newUsersLastWeek, // ← число, не строка
      avgLicenseDays: Math.round(avgLicenseDays * 100) / 100, // округлить до 2 знаков
      expiringSoon
    });

  } catch (err) {
    console.error('Ошибка в /license-stats:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
// --- ЛОГИ ВХОДА ---

router.get('/login-logs', authenticateToken, requireAdmin, async (req, res) => {
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

    const formatted = logs.map(log => {
      let timestamp = Number(log.createdat);
      return {
        ...log,
        createdAt: !isNaN(timestamp) ? new Date(timestamp).toLocaleString() : "—",
        success: log.success === 1 || log.success === true
      };
    });


    res.json(formatted);
  } catch (err) {
    console.error('Ошибка в /login-logs:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;