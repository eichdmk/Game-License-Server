let db = null;

export const setDB = (database) => {
  db = database;
};

export const blockIPMiddleware = async (req, res, next) => {
  const rawIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ip = rawIP?.replace('::ffff:', '') || 'unknown';

  if (!db) {
    console.warn('blockIPMiddleware: БД не подключена');
    return next();
  }

  try {
    const blocked = await db.get(
      `SELECT reason, expiresAt FROM blocked_ips 
    WHERE ip = $1 AND (expiresAt IS NULL OR expiresAt > $2)`,
      [ip, Date.now()]
    );

    if (blocked) {
      return res.status(403).json({
        error: "Доступ запрещён: ваш IP-адрес заблокирован",
        reason: blocked.reason || "Причина не указана",
        until: blocked.expiresAt
          ? new Date(blocked.expiresAt).toLocaleString('ru-RU')
          : "навсегда",
      });
    }

    next();
  } catch (err) {
    console.error("Ошибка проверки IP-блокировки:", err);
    next();
  }
};