import jwt from 'jsonwebtoken';

let db = null;

export const setDB = (database) => {
  db = database;
};

const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    if (!db) {
      return res.status(500).json({ error: 'База данных не подключена' });
    }

    const user = await db.get(
      'SELECT id, firstName, lastName, email, phone, isadmin AS "isAdmin", licenseEndDate FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.licenseEndDate <= Date.now()) {
      return res.status(403).json({
        error: 'Срок вашей лицензии истёк. Обратитесь к администратору.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Ошибка в authenticateToken:', err.message || err);
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Срок действия токена истёк' });
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};