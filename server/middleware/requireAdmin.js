import { connectDB } from '../db.js';

let db;

export const requireAdmin = async (req, res, next) => {
  try {
    if (!db) {
      db = await connectDB();
    }

    const user = await db.get('SELECT isAdmin FROM users WHERE id = ?', [req.user.id]);

    if (!user || user.isAdmin !== 1) {
      return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
    }

    next();
  } catch (err) {
    console.error('Ошибка в requireAdmin:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
