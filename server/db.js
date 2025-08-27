// db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

export const connectDB = async () => {
  const db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  // Создаём таблицу с новыми полями
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      licenseEndDate INTEGER NOT NULL,
      isAdmin INTEGER DEFAULT 0
    )
  `);

  // Проверяем, есть ли админ
  const admin = await db.get("SELECT * FROM users WHERE isAdmin = 1");
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    const oneYearFromNow = Date.now() + 365 * 86400000; // 1 год

    await db.run(
      `INSERT INTO users (firstName, lastName, phone, email, password, licenseEndDate, isAdmin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["Админ", "Админов", "+79991234567", "admin@game.com", hashed, oneYearFromNow, 1]
    );
    console.log("✅ Админ создан: admin@game.com / admin123");
  }

  console.log('✅ SQLite подключена (game.db)');
  return db;
};