const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

// DB connection pool using env vars
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;
async function initDbPool() {
  pool = mysql.createPool(dbConfig);
  // create table if not exists
  const createTbl = `
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  const conn = await pool.getConnection();
  await conn.query(createTbl);
  conn.release();
}
initDbPool().catch(err => {
  console.error('DB init error:', err);
  process.exit(1);
});

// GET Root url - also for health probes
app.get('/', (req, res) => {
  res.status(200).send('Hello...app service root!');
});

// POST  - db write
app.post('/posts', async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const [result] = await pool.query('INSERT INTO posts (title, body) VALUES (?, ?)', [title, body || null]);
    res.status(201).json({ id: result.insertId, title, body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// GET - db read
app.get('/posts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, body, created_at FROM posts ORDER BY id DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// GET - external api call. Change with app setting EXTERNAL_API_URL
app.get('/external', async (req, res) => {
  try {
    const response = await axios.get(process.env.EXTERNAL_API_URL || 'https://api.github.com/', {
      timeout: 10000
    });
    res.json({
      status: response.status,
      headers: response.headers,
      data: response.data
    });
  } catch (err) {
    console.error('external request error', err.message || err);
    if (err.response) {
      res.status(err.response.status).json({ error: 'upstream error', details: err.response.data });
    } else {
      res.status(502).json({ error: 'request failed', message: err.message });
    }
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
