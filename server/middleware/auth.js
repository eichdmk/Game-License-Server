import jwt from 'jsonwebtoken';
import { connectDB } from '../db.js';

let db;

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Недействительный токен' });

      if (!db) db = await connectDB();
      const user = await db.get('SELECT id, firstName, lastName, email, phone, isAdmin, licenseEndDate FROM users WHERE id = ?', [decoded.id]);

      if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

      req.user = user; 
      next();
    });

  } catch (err) {
    console.error('Ошибка в authenticateToken:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
