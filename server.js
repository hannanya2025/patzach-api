import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// אפשר לכל העולם – פתוח לניסויים
app.use(cors());

// פרסינג לבאדי
app.use(bodyParser.json());

app.post('/api/patzach', async (req, res) => {
  try {
    const { history } = req.body;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: history
      })
    });

    const data = await openaiRes.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'משהו השתבש, נסה שוב' });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Patzach API server is running on port ${PORT}`);
});
