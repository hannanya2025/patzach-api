import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors'; // 👈 הוספת מודול cors

const app = express();
const PORT = process.env.PORT || 3000;

// 🧠 פתרון CORS – מאפשר גישה מכל דומיין
app.use(cors()); // 👈 זו השורה הכי חשובה כאן

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // ביטחון כפול – למרות שכבר פתרנו עם app.use(cors())
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const OPENAI_KEY = process.env.OPENAI_KEY;

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
