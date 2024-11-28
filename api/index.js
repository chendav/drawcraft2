const express = require('express');
const app = express();

app.get('/config', (req, res) => {
  console.log('API route called');
  console.log('Environment variables:', Object.keys(process.env));
  console.log('API Key in server:', !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('API key not found in environment');
    return res.status(500).json({ 
      error: 'API key not found in environment',
      envKeys: Object.keys(process.env)
    });
  }
  
  res.json({
    apiKey: process.env.OPENAI_API_KEY,
    keyAvailable: true
  });
});

module.exports = app; 