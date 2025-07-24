import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  'https://www.25ros.com',
  'https://www-25ros-com.filesusr.com'
];

// ✅ CORS מסודר
app.use(cors({
  origin: function (origin, callback) {
    // local test or no origin (like Postman) = allow
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// 🔐 מפתח API
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

app.listen(PORT, () => {
  console.log(`🔥 השרת רץ על פורט ${PORT}`);
});
