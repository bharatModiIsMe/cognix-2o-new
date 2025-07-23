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

// Add Google Search proxy endpoint
app.post('/api/google/search', async (req, res) => {
  try {
    const { query } = req.body;
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=5`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Google Search proxy error', details: err.message });
  }
});

// Add YouTube Data API proxy endpoint
app.post('/api/youtube/search', async (req, res) => {
  try {
    const { query, maxResults } = req.body;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
    // Search videos
    const searchUrl = `${YOUTUBE_API_BASE_URL}/search?key=${YOUTUBE_API_KEY}&q=${encodeURIComponent(query)}&part=snippet&type=video&maxResults=${maxResults || 3}&order=relevance`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map((item) => item.id.videoId).join(',');
    // Get video details
    const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=contentDetails,snippet`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    res.json(detailsData);
  } catch (err) {
    res.status(500).json({ error: 'YouTube Search proxy error', details: err.message });
  }
});

// Add A4F speech-to-text proxy endpoint
app.post('/api/a4f/speech-to-text', async (req, res) => {
  try {
    const A4F_API_KEY = process.env.A4F_API_KEY;
    const A4F_API_URL = process.env.A4F_API_URL;
    // Use formidable or multer for file uploads in production
    // For now, assume req.body contains base64 audio
    const { audioBase64 } = req.body;
    const formData = new FormData();
    const buffer = Buffer.from(audioBase64, 'base64');
    formData.append('file', buffer, { filename: 'audio.wav', contentType: 'audio/wav' });
    formData.append('model', 'provider-2/whisper-1');
    formData.append('language', 'en');
    const response = await fetch(`${A4F_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A4F_API_KEY}`,
      },
      body: formData
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'A4F speech-to-text proxy error', details: err.message });
  }
});

// Add A4F video generation proxy endpoint
app.post('/api/a4f/video', async (req, res) => {
  try {
    const A4F_API_KEY = process.env.A4F_API_KEY;
    const A4F_API_URL = process.env.A4F_API_URL;
    const response = await fetch(`${A4F_API_URL}/video/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A4F_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'A4F video proxy error', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`A4F proxy server running on port ${PORT}`);
}); 