import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

export const connectDB = async () => {
  const db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    licenseEndDate INTEGER DEFAULT 0,
    isAdmin INTEGER DEFAULT 0
  )
`);

  // Проверка колонки licenseDays
  const columns = await db.all("PRAGMA table_info(users)");
  const hasLicenseDays = columns.some(col => col.name === 'licenseDays');
  if (!hasLicenseDays) {
    await db.exec("ALTER TABLE users ADD COLUMN licenseDays INTEGER DEFAULT 7");
    console.log('✅ Колонка licenseDays добавлена');
  }

  // Проверка колонки isAdmin
  const hasIsAdmin = columns.some(col => col.name === 'isAdmin');
  if (!hasIsAdmin) {
    await db.exec("ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0");
    console.log('✅ Колонка isAdmin добавлена');
  }

  // Создаём админа, если его нет
  const admin = await db.get("SELECT * FROM users WHERE isAdmin = 1");
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await db.run(
      `INSERT INTO users (username, password, licenseEndDate, isAdmin)
     VALUES (?, ?, ?, ?)`,
      ["admin", hashed, Date.now() + 30 * 86400000, 1]
    );
    console.log("✅ Админ создан: admin / admin123");
  }


  console.log('✅ SQLite подключена (game.db)');

  return db;
};
