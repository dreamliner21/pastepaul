const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db');

export default async function handler(req, res) {
  const { text, projectName, password } = req.body;
  const id = projectName.replace(/\s+/g, '-').toLowerCase();
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  db.run(
    'INSERT INTO pastes (id, content, password) VALUES (?, ?, ?)',
    [id, text, hashedPassword],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ id });
    }
  );
}
