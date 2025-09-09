
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

export const connectDB = async () => {
  try {
    const tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
    });

    await tempPool.query('SELECT NOW()');
    console.log('Подключено к PostgreSQL (системная база)');

    const dbName = process.env.DB_NAME || 'game_license';
    try {
      await tempPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`База данных "${dbName}" создана`);
    } catch (err) {
      if (err.code === '42P04') {
        console.log(`База данных "${dbName}" уже существует`);
      } else {
        throw err;
      }
    }

    await tempPool.end();

    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
    });

    await pool.query('SELECT NOW()');
    console.log(`Подключено к базе данных "${dbName}"`);


    await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    licenseEndDate BIGINT NOT NULL,
    isAdmin BOOLEAN DEFAULT FALSE  
  );
`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255),
        ip VARCHAR(45) NOT NULL,
        success INTEGER NOT NULL CHECK (success IN (0, 1)),
        userAgent TEXT,
        createdAt BIGINT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(45) UNIQUE NOT NULL,
        reason TEXT,
        blockedAt BIGINT NOT NULL,
        expiresAt BIGINT
      );
    `);

    const { rows } = await pool.query("SELECT * FROM users WHERE isAdmin = true");

    if (rows.length === 0) {
      const hashed = await bcrypt.hash("testPassword", 10);
      const oneYearFromNow = Date.now() + 365 * 86400000;

      await pool.query(
        `INSERT INTO users (firstName, lastName, phone, email, password, licenseEndDate, isAdmin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ["Админ", "Админов", "+79991234567", "TestUser@mail.ru", hashed, oneYearFromNow, true] // ← true вместо 1
      );
      console.log("Админ создан: TestUser@mail.ru / testPassword");
    }

    console.log('Все таблицы готовы');

    return {
      get: async (sql, params) => {
        const res = await pool.query(sql, params);
        return res.rows[0];
      },
      all: async (sql, params) => {
        const res = await pool.query(sql, params);
        return res.rows;
      },
      run: async (sql, params) => {
        const res = await pool.query(sql, params);
        return { changes: res.rowCount };
      }
    };

  } catch (err) {
    console.error('Ошибка подключения к PostgreSQL:', err.message);
    throw err;
  }
};