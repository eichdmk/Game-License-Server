import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

let db;

export const setDependencies = (database) => {
  db = database;
};

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const format = req.query.format || 'csv';
  
  try {
    const users = await db.all(`
      SELECT 
        id, 
        firstName, 
        lastName, 
        phone, 
        email, 
        licenseEndDate,
        CASE 
          WHEN licenseEndDate > $1 THEN 'active' 
          ELSE 'expired' 
        END as status
      FROM users
    `, [Date.now()]);

    if (format === 'csv') {
      const csv = [
        ['ID', 'Имя', 'Фамилия', 'Телефон', 'Email', 'Дата окончания', 'Статус'].join(','),
        ...users.map(u => [
          u.id,
          `"${u.firstName}"`,
          `"${u.lastName}"`,
          `"${u.phone || ''}"`,
          `"${u.email}"`,
          `"${new Date(u.licenseEndDate).toLocaleDateString()}"`,
          u.status
        ].join(','))
      ].join('\n');

      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=users_export.csv');
      res.send(csv);
    } 
    else if (format === 'json') {
      res.json(users);
    } 
    else {
      res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
  } catch (err) {
    console.error('Ошибка экспорта:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;