// server.js — ФИНАЛЬНАЯ ВЕРСИЯ 🚀

import 'dotenv/config';
import express from 'express';
import { connectDB } from './db.js';
import { blockIPMiddleware, setDB as setBlockIPDB } from './middleware/blockIP.js';
import { requireAdmin, setDB as setRequireAdminDB } from './middleware/requireAdmin.js';
import { authenticateToken, setDB as setAuthDB } from './middleware/auth.js';

import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Проверка секретов
if (!process.env.JWT_SECRET) {
  console.error('ОШИБКА: Не задан JWT_SECRET в .env');
  process.exit(1);
}
if (!process.env.LICENSE_SIGNING_SECRET) {
  console.error('ОШИБКА: Не задан LICENSE_SIGNING_SECRET в .env');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const LICENSE_SIGNING_SECRET = process.env.LICENSE_SIGNING_SECRET;
const app = express();

// Middleware
app.use(blockIPMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Лимитер для /login
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Слишком много попыток входа. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/login', limiter);

let db;

// Очистка старых логов
const cleanupOldLogs = async () => {
  try {
    const oneMonthAgo = Date.now() - 30 * 86400000;
    const result = await db.run(`DELETE FROM login_logs WHERE createdAt < ?`, [oneMonthAgo]);
    console.log(`🧹 Очищено ${result.changes} старых логов входа`);
  } catch (err) {
    console.error('❌ Ошибка при очистке логов:', err);
  }
};

// ✅ ИСПРАВЛЕНО: Импортируем и default, и setDependencies для каждого роутера
import authRouter, { setDependencies as setAuthDependencies } from './routes/auth.routes.js';
import adminRouter, { setDependencies as setAdminDependencies } from './routes/admin.routes.js';
import exportRouter, { setDependencies as setExportDependencies } from './routes/export.routes.js';

// Запуск сервера
const startServer = async () => {
  try {
    db = await connectDB();
    if (!db) {
      console.error('❌ connectDB() вернул undefined');
      process.exit(1);
    }
    console.log('✅ База данных подключена');

    // Передаём db в middleware
    setBlockIPDB(db);
    setAuthDB(db);
    setRequireAdminDB(db);

    // ✅ ИСПРАВЛЕНО: Передаём зависимости в роутеры через правильные именованные импорты
    setAuthDependencies(db, JWT_SECRET, LICENSE_SIGNING_SECRET);
    setAdminDependencies(db);
    setExportDependencies(db);

    // Подключаем роутеры
    app.use('/api/v1', authRouter);
    app.use('/api/v1/admin', adminRouter);
    app.use('/api/v1/export-users', exportRouter);

    // Запускаем очистку логов
    await cleanupOldLogs();
    setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // раз в сутки

    // Старт сервера
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
      console.log(`🌍 API доступно по: http://localhost:${PORT}/api/v1/`);
    });
  } catch (err) {
    console.error('❌ Ошибка при запуске сервера:', err);
    process.exit(1);
  }
};

startServer();