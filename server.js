import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // טוען את משתני הסביבה מקובץ .env

const app = express();
const port = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_KEY;

if (!OPENAI_KEY) {
  console.error('❌ OPENAI_KEY is not defined in the environment variables');
  process.exit(1);
}

app.use(cors({
  origin: '*', // או תחליף לכתובת של האתר שלך
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.post('/api/patzach', async (req, res) => {
  const { history } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: history,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OpenAI API error:', data);
      return res.status(500).json({ error: 'Failed to generate response', details: data });
    }

    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error('❌ Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
