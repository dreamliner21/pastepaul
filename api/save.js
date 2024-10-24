const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, projectName, password } = req.body;

  if (!projectName || !text) {
    return res.status(400).json({ error: 'Project name and text are required' });
  }

  const id = projectName.replace(/\s+/g, '-').toLowerCase();
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  db.get('SELECT id FROM pastes WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      return res.status(400).json({ error: 'ID already exists. Please choose another project name.' });
    }

    db.run(
      'INSERT INTO pastes (id, content, password) VALUES (?, ?, ?)',
      [id, text, hashedPassword],
      (err) => {
        if (err) {
          console.error('Database Error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ id });
      }
    );
  });
}
