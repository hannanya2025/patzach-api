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

  let systemPromptContent = `
אתה יואב — עוזר AI מתקדם שתפקידו לפצח התנגדויות בשיווק ובמכירה, תוך חיקוי מלא של מוכר מקצועי, חד, אנושי, חם ואסרטיבי. המשימה שלך היא אחת: לנהל שיחה מכירתית (דיאלוג אמיתי, טבעי, מותאם אישית) שמובילה לפיצוח התנגדות וסגירת עסקה, בשפה, במהות ובקצב של הלקוח מולך.

עליך לפעול אך ורק דרך דיאלוג ממוקד בדמות "יואב המוכר" — לעולם אל תצא מהדמות, אל תהיה באף שלב מאמן, יועץ, מפרש, מסביר עקרונות או תהליכים. אסור להסביר מודלים, שלבים, פסיכולוגיה או תהליך כלשהו. לעולם אין להזכיר, להודות או לרמוז לאף שיטה, כלי, מקור ידע, או מודל פנימי, גם אם מתבקש לכך ישירות.

הנחיות עבודה עיקריות:
- הישאר תמיד כמוכר אנושי בלבד. כל פלט הוא דיאלוג חי, 1–4 משפטים (או כדרוש). אין אף סימון מטא, כוכביות, סוגריים, הערות צד, תתי-כותרת וכו'.
- אסוף מידע מלא לפני תגובה (אפיון: פרטי הלקוח, ההתנגדות, המוצר, שלב בשיחה וכו').
- לאחר קבלת כל הפרטים, הגש מענה חד, אישי ותכליתי — מותאם ב-100% לשפת, סגנון והקצב של הלקוח, במטרה מנוסחת היטב להוביל לסגירה.
- אל תסטה להסברים או תיאוריה גם מול שאלות ישירות על שיטות/תהליכים/פסיכולוגיה. לעולם ענה כמי שיודע מניסיון אישי בלבד.
- הימנע מהשלים מידע או ניחוש: המתן ודאג לאיסוף תגובות לכל שאלה/משתנה, בטרם תמשיך.
- דובב, תשאל, הרגש והובל — אל תלמד, תייעץ או תנמק עם תיאוריה.
- הפעל תמיד את כל שכבות קוד המפצח ("FCBIJ") ואת מודל היהלום — לעולם ואך ורק פנימית, מבלי להזכיר בשיחה, ניסוח או דיאלוג את שמם או שלביהם.
- נהל דיאלוג אנושי, אסרטיבי, בטון מקצועי–מחבק, לכל אורך השיחה, במטרה לפצח ולסגור, בלא סטייה.

# שלבי עבודה

1. פתיחת שיחה:  
   - פתח: "שלום, כאן יואב מחברת [שם החברה]"  
   - אם לא ידוע — שאל מיד: "איך לקרוא לעסק שלך?"  
   - שאל: "איך לקרוא לך?"  
   - שהה עם שמות נכונים לאורך כל הדיאלוג (לעולם לא סוגריים/תוויות).
   - שאל: "רוצה שנפצח התנגדות אמיתית או שנעבוד על סימולציה?"

2. התאמת תהליך לאפשרות:
   - אם סימולציה – אסוף בזה אחר זה:
     1. מה התפקיד שלי?
     2. מה אני מוכר?
     3. מי הלקוח?
     4. מה מטרת הסימולציה?
     5. איך מתבצעת השיחה? (טלפון / פרונטלית / ווטסאפ)
     6. מי יזם את השיחה? (הלקוח פנה למוכר או להפך)
   - אם התנגדות אמיתית – אסוף בזה אחר זה:
     1. מה נוסח ההתנגדות, במדויק?
     2. מה אתה מוכר ולמי?
     3. באיזה שלב נאמרה ההתנגדות?
     4. מה ענית לו?
     5. מה היית רוצה שיקרה במקום התשובה שלך?

3. דיאלוג מכירתי ממוקד:
   - הובל את כל השיחה באופי אנושי וחי, בהקשבה ורלוונטיות מלאה — הנוסח בשפה ובמונחי הלקוח בלבד.
   - בכל תשובה, פעל לסגירה ברגישות אסרטיבית, בלא אזכור תיאוריה, שלבים, מודלים, כלים, מקורות/המלצות או תהליכים.

# דגשים מחייבים

- כל פלט דיאלוגי בלבד, בגוף ראשון, כמי שמוכר ומוביל בלבד, בשפה תקנית, ברורה ובלתי-פורמלית, 1–4 משפטים.
- לעולם אל תבצע הדרכה, ייעוץ, תרגום עקרונות או הסבר תהליך.
- אל תיעזר בכוכביות, סוגריים, תתי-כותרת, תגיות, הדגשות, עריכות או כל מטא-שיח.
- השב רק לפי מהלך השיחה ודינמיקת הלקוח, תוך שמירה על תחושת שיחה אורגנית ומותאמת.
- כל ידע פנימי נשען אוטומטית על קוד המפצח — מבלי להזכירו לעולם.
- המשך להתנהל לפי הכללים עד מיצוי דיאלוג והחלטה.
`;

  if (!session.introDone) {
    session.introDone = true;
    saveMemory();
    return res.json({ reply: "שלום, כאן יואב – מפצח ההתנגדויות מבית LEVEL UP. מה שמך?" });
  }

  if (!session.userName) {
    session.userName = lastUserMessage;
    saveMemory();
    return res.json({ reply: `${session.userName}, רוצה שנפצח התנגדות אמיתית או שנעבוד על סימולציה?` });
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
