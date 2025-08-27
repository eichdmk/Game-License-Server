import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./game.db");

db.run("DELETE FROM users WHERE username = ?", ["admin"], function (err) {
  if (err) {
    console.error("❌ Error deleting admin:", err.message);
  } else {
    console.log("✅ Deleted old admin (rows affected:", this.changes, ")");
  }
  db.close();
});

