export default function handler(req, res) {
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
  
  res.status(200).json({
    apiKey: process.env.OPENAI_API_KEY,
    keyAvailable: true
  });
} 