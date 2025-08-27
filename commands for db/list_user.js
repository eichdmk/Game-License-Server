import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./game.db");

db.all("SELECT id, username, isAdmin, licenseEndDate FROM users", (err, rows) => {
  if (err) {
    console.error("❌ Error reading users:", err.message);
  } else {
    console.log("📋 Users in DB:");
    console.table(rows);
  }
  db.close();
});