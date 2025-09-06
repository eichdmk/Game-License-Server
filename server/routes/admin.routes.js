import express from 'express';
import bcrypt from 'bcrypt';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

let db;

export const setDependencies = (database) => {
  db = database;
};


router.post('/block-ip', authenticateToken, requireAdmin, async (req, res) => {
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

router.delete('/unblock-ip/:ip', authenticateToken, requireAdmin, async (req, res) => {
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

router.get('/blocked-ips', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const blocked = await db.all(`SELECT * FROM blocked_ips ORDER BY blockedAt DESC`);
    res.json(blocked);
  } catch (err) {
    console.error('Ошибка получения списка IP:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
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

router.delete("/delete-user/:id", authenticateToken, requireAdmin, async (req, res) => {
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

router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
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

router.get('/license-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

    const newUsersLastWeek = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE licenseEndDate > ?
    `, [Date.now() - 7 * 86400000]);

    const avgLicenseDays = await db.get(`
      SELECT AVG((licenseEndDate - ?) / 86400000) as avgDays 
      FROM users 
      WHERE licenseEndDate > ?
    `, [Date.now(), Date.now()]);

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

export default router;