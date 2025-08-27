import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./game.db");

const username = "admin";
const password = "Igeref06"; // пароль
const isAdmin = 1;
const licenseEndDate = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 год лицензии

bcrypt.hash(password, 10).then((hash) => {
  db.run(
    `INSERT INTO users (username, password, isAdmin, licenseEndDate) VALUES (?, ?, ?, ?)`,
    [username, hash, isAdmin, licenseEndDate],
    function (err) {
      if (err) {
        console.error("❌ Error inserting admin:", err.message);
      } else {
        console.log("✅ Admin user created with ID:", this.lastID);
      }
      db.close();
    }
  );
});
