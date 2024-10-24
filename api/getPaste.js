const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db');

export default function handler(req, res) {
  const { id } = req.query;
  const { password } = req.body;

  db.get('SELECT content, password FROM pastes WHERE id = ?', [id], async (err, row) => {
    if (err) return res.status(500).send('Database error');
    if (!row) return res.status(404).send('Paste not found');

    const passwordMatch = row.password
      ? await bcrypt.compare(password, row.password)
      : true;

    if (!passwordMatch) return res.status(403).send('Incorrect password');
    res.send(row.content);
  });
}
