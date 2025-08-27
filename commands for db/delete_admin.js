import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('../server/game.db');

db.run("DELETE FROM users WHERE email = ?", ["admin@game.com"], function (err) {
  if (err) {
    console.error("❌ Ошибка при удалении админа:", err.message);
  } else if (this.changes === 0) {
    console.log("⚠️ Админ с email 'admin@game.com' не найден");
  } else {
    console.log(`✅ Админ удалён (удалено строк: ${this.changes})`);
  }
  db.close();
});