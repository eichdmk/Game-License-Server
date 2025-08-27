// list-users.js
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('../server/game.db');

db.all(`
  SELECT 
    id, 
    firstName, 
    lastName, 
    phone, 
    email, 
    isAdmin, 
    licenseEndDate 
  FROM users
`, (err, rows) => {
  if (err) {
    console.error("❌ Ошибка при чтении пользователей:", err.message);
  } else {
    console.log("📋 Все пользователи:");
    console.table(rows.map(user => ({
      ID: user.id,
      Имя: user.firstName,
      Фамилия: user.lastName,
      Телефон: user.phone,
      Email: user.email,
      Админ: user.isAdmin ? '✅' : '❌',
      'Окончание лицензии': new Date(user.licenseEndDate).toLocaleString()
    })));
  }
  db.close();
});