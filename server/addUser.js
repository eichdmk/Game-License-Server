  import { connectDB } from './db.js';
  import bcrypt from 'bcrypt';

  const run = async () => {
    const db = await connectDB();

    const username = process.argv[2];
    const password = process.argv[3];
    const licenseDays = process.argv[4] ? parseInt(process.argv[4]) : 7;

    if (!username || !password) {
      console.log('❌ Использование: node addUser.js <username> <password> [licenseDays]');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
      await db.run(
        `INSERT INTO users (username, password, licenseDays) VALUES (?, ?, ?)`,
        [username, hashed, licenseDays]
      );
      console.log(`✅ Игрок ${username} добавлен с лицензией ${licenseDays} дней`);
    } catch (err) {
      console.error('❌ Ошибка:', err.message);
    }

    await db.close();
  };

  run();
