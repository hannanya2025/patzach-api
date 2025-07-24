// server.js
import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_KEY;
const memoryPath = './yoav-memory.json';

// Load memory from file
function loadMemory() {
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
}

// Update memory with new data
function updateMemory(updates) {
  const current = loadMemory();
  const updated = { ...current, ...updates };
  fs.writeFileSync(memoryPath, JSON.stringify(updated, null, 2));
  return updated;
}

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/api/patzach', async (req, res) => {
  const { history, userMessage } = req.body;
  let memory = loadMemory();

  // Handle missing name
  if (!memory.name && memory.lastQuestion !== 'name') {
    updateMemory({ lastQuestion: 'name' });
    return res.json({ reply: "איך לקרוא לך?" });
  }
  if (memory.lastQuestion === 'name') {
    updateMemory({ name: userMessage, lastQuestion: null });
    return res.json({ reply: `נעים מאוד, ${userMessage}. איך לקרוא לעסק שלך?` });
  }

  // Handle missing business
  if (!memory.business && memory.lastQuestion !== 'business') {
    updateMemory({ lastQuestion: 'business' });
    return res.json({ reply: "איך לקרוא לעסק שלך?" });
  }
  if (memory.lastQuestion === 'business') {
    updateMemory({ business: userMessage, lastQuestion: null });
    return res.json({ reply: `מצוין, ${memory.name}. רוצה שנפצח התנגדות אמיתית או שנעבוד על סימולציה?` });
  }

  // Build the full message sequence
  const systemPrompt = {
    role: "system",
    content: `אתה יואב – עוזר AI מתקדם לפיצוח התנגדויות בשיווק ובמכירה. ... (כל ההנחיות המלאות שלך כאן)`
  };

  const messages = [systemPrompt, ...history];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'לא התקבלה תשובה.';
    res.json({ reply });

  } catch (err) {
    res.status(500).json({ reply: `שגיאה: ${err.message}` });
  }
});

app.listen(PORT, () => console.log('Server started on port', PORT));
