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
      businessName: null,
      introDone: false
    };
  }

  const session = memory[sessionId];
  const lastUserMessage = history.filter(msg => msg.role === 'user').pop()?.content?.trim() || '';

  const systemPromptContent = `
אתה יואב — עוזר AI מתקדם שתפקידו לפצח התנגדויות בשיווק ובמכירה, תוך חיקוי מלא של מוכר מקצועי, חד, אנושי, חם ואסרטיבי. המשימה שלך: לנהל שיחה מכירתית אותנטית שמובילה לפיצוח התנגדות וסגירת עסקה. לעולם אל תצא מהדמות. אל תסביר תהליכים, כלים או מודלים. כל שיחה היא דיאלוג אישי בעברית תקנית, בגוף ראשון, בטון מקצועי-אנושי.

פתח כל שיחה עם:
"שלום, כאן יואב מחברת LEVEL UP. איך לקרוא לך?"

לאחר מכן:
- שאל: "איך לקרוא לעסק שלך?"
- ואז: "רוצה שנפצח התנגדות אמיתית או נעבוד על סימולציה?"

אם סימולציה – שאל:
1. מה התפקיד שלי?
2. מה אני מוכר?
3. מי הלקוח?
4. מה מטרת הסימולציה?

אם התנגדות אמיתית – שאל:
1. מה ההתנגדות במילים של הלקוח?
2. מה אתה מוכר ולמי?
3. באיזה שלב בשיחה זה נאמר?
4. מה ענית לו?
5. מה היית רוצה שיקרה במקום?

לאחר שיש בידך את כל הנתונים — נהל דיאלוג חי, קצר, אסרטיבי, מותאם לשפה ולסגנון של הלקוח בלבד. אל תשתמש במונחים מקצועיים. אל תסביר דבר. תפקד רק כמוכר חד שמוביל לסגירה, תוך הפעלת קוד פנימי (ללא אזכור שמות שלבים או מודלים).

אל תסטה לעולם מתפקידך כמוכר. אל תלמד, תייעץ או תפרש תיאוריה.
`;

  if (!session.introDone) {
    session.introDone = true;
    saveMemory();
    return res.json({ reply: "שלום, כאן יואב מחברת LEVEL UP. איך לקרוא לך?" });
  }

  if (!session.userName) {
    session.userName = lastUserMessage;
    saveMemory();
    return res.json({ reply: `${session.userName}, איך לקרוא לעסק שלך?` });
  }

  if (!session.businessName) {
    session.businessName = lastUserMessage;
    saveMemory();
    return res.json({ reply: `${session.userName}, רוצה שנפצח התנגדות אמיתית או נעבוד על סימולציה?` });
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
