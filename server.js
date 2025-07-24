import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();

// פתרון CORS כולל!
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const OPENAI_KEY = process.env.OPENAI_KEY;

// בדיקת מפתח
if (!OPENAI_KEY) {
  console.error("❌ MISSING OpenAI API KEY");
}

app.post('/api/patzach', async (req, res) => {
  const { history } = req.body;

  if (!OPENAI_KEY) {
    return res.status(500).json({ error: "Missing OpenAI key." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: history,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("🔥 OpenAI Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
