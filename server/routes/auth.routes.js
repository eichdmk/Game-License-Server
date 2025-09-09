import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/authenticateToken.js'
import crypto from "crypto";

const router = express.Router();

let db, JWT_SECRET, LICENSE_SIGNING_SECRET;

export const setDependencies = (database, jwtSecret, licenseSecret) => {
  db = database;
  JWT_SECRET = jwtSecret;
  LICENSE_SIGNING_SECRET = licenseSecret;
};

function createLicenseSignature(userId, licenseEndDate) {
  const data = `${userId}:${licenseEndDate}`;
  return crypto
    .createHmac("sha256", LICENSE_SIGNING_SECRET)
    .update(data)
    .digest("hex");
}


router.post('/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  const userAgent = req.headers['user-agent'];
  const { email, password } = req.body;

  const logAttempt = async (success, userId = null) => {
    try {
      await db.run(
        `INSERT INTO login_logs (userId, email, ip, success, userAgent, createdAt) VALUES ($1, $2, $3, $4, $5, $6)`,
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

    const user = await db.get(
      `SELECT id, firstname AS "firstName", lastname AS "lastName", phone, email, password, licenseEndDate, isadmin AS "isAdmin"
       FROM users
       WHERE email = $1`,
      [email]
    );

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
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
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


router.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT id, firstname AS "firstName", lastname AS "lastName", phone, email, password, licenseEndDate, isadmin AS "isAdmin"
   FROM users
   WHERE id = $1`,
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

router.get('/check-license', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, email, licenseEndDate FROM users WHERE id = $1',
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

export default router;