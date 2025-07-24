import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = 'https://www.25ros.com';

// 🔐 Middleware – CORS אוטומטי
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔐 Middleware – תוספת ידנית ל-Render ולדפדפן
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(bodyParser.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.post('/api/patzach', async (req, res) => {
  const { history } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: history,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'לא הצלחתי להבין את הבקשה.';
    res.json({ reply });
  } catch (error) {
    console.error('שגיאה בשרת:', error);
    res.status(500).json({ reply: 'אירעה שגיאה, נסה שוב מאוחר יותר.' });
  }
});

// 🧪 טיפול בבקשות OPTIONS מראש (Preflight)
app.options('/api/patzach', (req, res) => {
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`🔥 השרת רץ על פורט ${PORT}`);
});
