const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Membuat tabel secara otomatis saat server berjalan
db.run(`
  CREATE TABLE IF NOT EXISTS pastes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    password TEXT
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table "pastes" is ready.');
  }
});

// Route untuk menyimpan paste
app.post('/api/save', async (req, res) => {
  const { text, projectName, password } = req.body;

  // Pastikan projectName dan text tidak kosong
  if (!projectName || !text) {
    return res.status(400).json({ error: 'Project name and text are required' });
  }

  const id = projectName.replace(/\s+/g, '-').toLowerCase();
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  // Cek apakah ID sudah ada di database
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
        res.json({ id });
      }
    );
  });
});

// Route untuk mengambil paste dalam format JSON
app.get('/api/get/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT content, password FROM pastes WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).send('Database error');
    if (!row) return res.status(404).send('Paste not found');

    res.json({ content: row.content, passwordProtected: !!row.password });
  });
});

// Route untuk menampilkan paste di browser
app.get('/p/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT content, password FROM pastes WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    if (!row) {
      return res.status(404).send('<h1>Paste not found</h1>');
    }

    // Render HTML dengan konten paste
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paste - ${id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white h-screen flex items-center justify-center">
        <div class="max-w-2xl w-full p-5 bg-gray-800 rounded shadow-lg">
          <h1 class="text-3xl font-bold mb-4">Paste ID: ${id}</h1>
          <pre class="bg-gray-700 p-4 rounded whitespace-pre-wrap">${row.content}</pre>
        </div>
      </body>
      </html>
    `);
  });
});

// Jalankan server
const PORT = process.env.PORT || 7890;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
