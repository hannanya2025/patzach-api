import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_KEY;

app.use(cors()); // ⬅️ זה מאפשר גישה מכל דומיין!
app.use(bodyParser.json());

app.post('/api/patzach', async (req, res) => {
  try {
    console.log('📥 POST /api/patzach');
    const { history } = req.body;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: history,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OpenAI Error:', data);
      return res.status(500).json({ error: data });
    }

    const reply = data.choices?.[0]?.message?.content || '🤖 לא התקבלה תגובה';
    res.json({ reply });

  } catch (err) {
    console.error('🔥 Server error:', err);
    res.status(500).json({ error: 'שגיאה בשרת. נסה שוב.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
