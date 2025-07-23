const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
app.use(cors());
app.use(bodyParser.json());

const A4F_API_KEY = process.env.A4F_API_KEY;
const A4F_API_URL = process.env.A4F_API_URL;

async function proxyA4F(req, res, endpoint) {
  try {
    const response = await fetch(`${A4F_API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${A4F_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'A4F API proxy error', details: err.message });
  }
}

app.post('/api/a4f/text', (req, res) => proxyA4F(req, res, 'chat/completions'));
app.post('/api/a4f/image', (req, res) => proxyA4F(req, res, 'images/generations'));
app.post('/api/a4f/edit', (req, res) => proxyA4F(req, res, 'images/edits'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`A4F proxy server running on port ${PORT}`);
}); 