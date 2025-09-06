let db = null;
export const setDB = (database) => {
  db = database;
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!db) {
      console.error('❌ База данных не инициализирована в requireAdmin');
      return res.status(500).json({ error: 'Ошибка сервера: БД не подключена' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Пользователь не аутентифицирован' });
    }

    const user = await db.get('SELECT isAdmin FROM users WHERE id = ?', [req.user.id]);

    if (!user || user.isAdmin !== 1) {
      return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
    }

    next();
  } catch (err) {
    console.error('❌ Ошибка в requireAdmin:', err.message || err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};