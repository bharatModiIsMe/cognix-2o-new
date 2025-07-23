const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Middleware to set CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for now, consider restricting in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// API key from environment variables
const A4F_API_KEY = process.env.A4F_API_KEY;
const A4F_BASE_URL = 'https://api.a4f.co/v1';

// Helper function to make requests to A4F API
async function callA4fApi(endpoint, body) {
  try {
    const response = await fetch(`${A4F_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${A4F_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`A4F API error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling A4F API endpoint ${endpoint}:`, error);
    throw error;
  }
}

// Route for text chat
app.post('/api/a4f/chat', async (req, res) => {
  try {
    const response = await callA4fApi('/chat/completions', req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for image generation
app.post('/api/a4f/generate', async (req, res) => {
  try {
    const response = await callA4fApi('/images/generations', req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for image editing
app.post('/api/a4f/edit', async (req, res) => {
  try {
    // A4F image editing API might require FormData for image uploads.
    // For simplicity, this example assumes a JSON body similar to generation.
    // You might need to adjust this part based on the actual A4F image editing API documentation.
    const response = await callA4fApi('/images/edits', req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});