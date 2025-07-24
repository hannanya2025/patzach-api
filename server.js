import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_KEY;

// CORS פתוח לכולם
app.use(cors());
app.use(bodyParser.json());

// בדיקת חיים
app.get('/', (req, res) => {
  res.send('🔥 Patzach API is live');
});

// מסלול API
app.post('/api/patzach', async (req, res) => {
  try {
    const { history } = req.body;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4', // או 'gpt-3.5-turbo'
        messages: history
      })
    });

    const data = await openaiRes.json();
    res.json(data);
  } catch (err) {
    console.error('OpenAI Error:', err);
    res.status(500).json({ error: 'Something went wrong with OpenAI request.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
