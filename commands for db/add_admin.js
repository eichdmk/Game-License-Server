// add-admin.js
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('../server/game.db');

const firstName = "Луна";
const lastName = "Админов";
const phone = "+79991234567";
const email = "luna@mail.ru";
const password = "Igeref06"; 
const isAdmin = 1;
const licenseEndDate = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 год

bcrypt.hash(password, 10).then((hash) => {
  db.run(
    `INSERT INTO users (firstName, lastName, phone, email, password, isAdmin, licenseEndDate) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, phone, email, hash, isAdmin, licenseEndDate],
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          console.error("❌ Ошибка: Пользователь с таким email уже существует");
        } else {
          console.error("❌ Ошибка при добавлении админа:", err.message);
        }
      } else {
        console.log(`✅ Админ создан: ID=${this.lastID}, Email=${email}`);
      }
      db.close();
    }
  );
});