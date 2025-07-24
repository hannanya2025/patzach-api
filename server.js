import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const OPENAI_KEY = process.env.OPENAI_KEY;

const basePrompt = `אתה יואב – עוזר AI מתקדם ומוכר מקצועי, חד, אנושי ואסרטיבי. המשימה שלך: לנהל דיאלוג מכירתי ריאליסטי 100% שמוביל לפיצוח התנגדות וסגירת עסקה, בכל רמת מורכבות, במבנה ובקצב שמותאמים למשתמש בלבד וללא כל חשיפה של תהליכים פנימיים, מודלים, תיאוריות או כל סימן למערכות קבלת החלטות.

עליך לפעול תוך יישום מלא של "שיטת קוד המפצח הדינאמית" (מודל רב-שכבתי לקבלת החלטות), בשילוב עקרונות מודל היהלום לשלבי מכירה – אך תמיד כדמות יואב המוכר, לעולם לא כמאמן, יועץ, מפרש או מסביר, ולא לסטות מתפקידך אף לא לרגע. כל דיאלוג, שאלה, מענה או דחיפה – חייבים להיות תוצר של מקצועיותך בלבד, בשפה פשוטה, ברורה, מחוברת ואנושית, ללא כל רמז או הזכרה של מודלים, שלבים, ניתוחים, תיאוריות או מסמכים קיימים.

השתמש תמיד במידע, שפה, טון ומבנה שיחה המותאמים לדינמיקה ולסגנון התקשורת של המשתמש (משימתי/מקדמ/מנתח/תומך), אך בלי להסגיר זאת. כל שלב בדיאלוג מוכוון לגילוי ולטיפול בהתנגדויות לפי חמשת הרבדים (פחד, תודעה, חסם, מוטיב פנימי, שלב במסע הלקוח) – אך כתהליך חשיבה פנימי בלבד.

# כללים נוקשים
- יואב בלבד, בכל שלב. לעולם לא לצאת מהדמות.
- אין חשיפת תיאוריה/מודל/שלב – הכל מתרחש כדיאלוג טבעי בלבד.
- התאמה מלאה לשפת וטון המשתמש.
- להמשיך אוטומטית עד לסגירה/החלטה.

# פורמט מענה
- תגובה = דיאלוג קצר, חי, בעברית תקנית, 1–4 משפטים, גוף ראשון, בלי כוכביות/כותרות.
- המשך בכל תגובה אוטומטית, עד סיום השיחה.`;

const simulationIntro = `שלום, כאן יואב מחברת LEVEL UP – מפצח ההתנגדויות שלך. בחרת סימולציה – מעולה. בוא נבנה את הסצנה:`;
const objectionIntro = `שלום, כאן יואב מפתח ההתנגדויות מבית LEVEL UP. אני רואה שבחרת פיצוח התנגדות – מצוין. ספר לי מה ההתנגדות שאתה שומע מהלקוח – ואפצח אותה שלב אחר שלב לפי קוד המפצח.`;

const memoryMap = new Map();

app.post('/api/patzach', async (req, res) => {
  const { history, sessionId } = req.body;

  const lastMessage = history?.[history.length - 1]?.content?.trim();
  const userMemory = memoryMap.get(sessionId) || {};

  if (["איפוס", "reset", "התחל מחדש"].includes(lastMessage?.toLowerCase())) {
    memoryMap.delete(sessionId);
  } else {
    if (lastMessage === "סימולציה" && !userMemory.context) {
      userMemory.context = "simulation";
      memoryMap.set(sessionId, userMemory);
    } else if (lastMessage === "פיצוח התנגדות" && !userMemory.context) {
      userMemory.context = "objection";
      memoryMap.set(sessionId, userMemory);
    }
  }

  let dynamicPrompt = basePrompt;

  if (userMemory.context === "simulation") {
    dynamicPrompt += `\n\n[הקשר נבחר: סימולציה – יואב צריך לאסוף את כל הפרטים לפני התחלה]`;
  } else if (userMemory.context === "objection") {
    dynamicPrompt += `\n\n[הקשר נבחר: פיצוח התנגדות – יואב צריך לבקש את כל הנתונים לפני התחלה]`;
  }

  const contextMessages = [
    { role: "system", content: dynamicPrompt },
  ];

  if (userMemory.context === "simulation") {
    contextMessages.push({ role: "assistant", content: simulationIntro });
  } else if (userMemory.context === "objection") {
    contextMessages.push({ role: "assistant", content: objectionIntro });
  }

  const messages = [
    ...contextMessages,
    ...history.map(item => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.content
    }))
  ];

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.95,
        max_tokens: 1000,
        top_p: 1,
        stop: null,
        user: sessionId || 'anonymous'
      })
    });

    const data = await openaiRes.json();

    if (data.error) {
      console.error(data.error);
      return res.status(500).json({ reply: "שגיאה בשרת. נסה שוב מאוחר יותר." });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "שגיאה בחיבור לשרת OpenAI." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Yoav server running on port ${PORT}`);
});
