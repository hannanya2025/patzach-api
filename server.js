import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // טוען את .env

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY; // שים לב לשם!

app.post('/api/patzach', async (req, res) => {
  const { history, sessionId } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
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
