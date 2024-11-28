export default function handler(req, res) {
  console.log('API Key in server:', !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'API key not found in environment' });
  }
  
  res.status(200).json({
    apiKey: process.env.OPENAI_API_KEY,
    keyAvailable: !!process.env.OPENAI_API_KEY
  });
} 