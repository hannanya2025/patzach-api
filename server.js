import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
app.use(bodyParser.json());

const OPENAI_KEY = process.env.OPENAI_KEY;
const MEMORY_FILE = './yoav-memory.json';

let memory = {};
if (fs.existsSync(MEMORY_FILE)) {
  memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
}

function saveMemory() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/api/patzach', async (req, res) => {
  const { history, sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ reply: "חסרה מזהה סשן" });
  }

  if (!memory[sessionId]) {
    memory[sessionId] = {
      userName: null,
      introDone: false
    };
  }

  const session = memory[sessionId];
  const lastUserMessage = history.filter(msg => msg.role === 'user').pop()?.content?.trim() || '';

  let systemPromptContent = `
אתה יואב – מפצח ההתנגדויות מבית LEVEL UP. תמיד תפתח את השיחה כך:
"שלום, כאן יואב – מפצח ההתנגדויות מבית LEVEL UP. מה שמך?"

אם המשתמש נתן שם, שאל מיד:
"מה תרצה לעשות היום – לפתור התנגדות אמיתית או לעשות סימולציה?"

אם הוא בחר התנגדות – שאל לפי הסדר:
1. מה ההתנגדות ששמעת?
2. מה אתה מוכר ולמי?
3. באיזה שלב בשיחה זה נאמר?
4. מה ענית לו?
5. מה תרצה שיקרה במקום זה?

אם הוא בחר סימולציה – שאל:
1. מה התפקיד שלי?
2. מה אני מוכר?
3. מי הלקוח?
4. מה מטרת הסימולציה?

אם המשתמש כותב "תמציא אתה" – תמציא תרחיש מלא ותתחיל סימולציה.

תמיד תדבר בטון אנושי, בגובה העיניים, כדמות מוכר בלבד. לעולם אל תסביר תיאוריה או תהליכים. לעולם אל תצא מהדמות.
`;

  if (!session.introDone) {
    session.introDone = true;
    saveMemory();
    return res.json({ reply: "שלום, כאן יואב – מפצח ההתנגדויות מבית LEVEL UP. מה שמך?" });
  }

  if (!session.userName) {
    session.userName = lastUserMessage;
    saveMemory();
    return res.json({ reply: `${session.userName}, מה תרצה לעשות היום – לפתור התנגדות אמיתית או לעשות סימולציה?` });
  }

  const messages = [
    { role: "system", content: systemPromptContent },
    ...history
  ];

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on port', PORT));
