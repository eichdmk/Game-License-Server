// middleware/blockIP.js
import { connectDB } from "../db.js";

export const blockIPMiddleware = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const db = await connectDB(); // подключение

    const blocked = await db.get(
      `SELECT * FROM blocked_ips WHERE ip = ? AND (expiresAt IS NULL OR expiresAt > ?)`,
      [ip, Date.now()]
    );

    if (blocked) {
      return res.status(403).json({
        error: "Доступ запрещён: ваш IP-адрес заблокирован",
        reason: blocked.reason,
        until: blocked.expiresAt
          ? new Date(blocked.expiresAt).toISOString()
          : "навсегда",
      });
    }

    next();
  } catch (err) {
    console.error("Ошибка проверки IP:", err);
    next(); // продолжаем, чтобы не забанить всех при ошибке
  }
};
