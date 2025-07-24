import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ מאפשר POST ובקשות OPTIONS מכל מקור בעולם
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // 🌍 פתוח לכולם
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // מה שמותר
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // משיב בלי תוכן ל־preflight
  }

  next();
});

// 🔧 מסלול POST לדוגמה
app.post('/api/patzach', async (req, res) => {
  try {
    const { history } = req.body;
    console.log("היסטוריה התקבלה:", history);

    // ✨ תחזיר תגובה מדומה
    res.json({ reply: "אני שומע אותך! (תגובה מהשרת 🧠)" });
  } catch (err) {
    console.error("שגיאה:", err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
});

// 🚀 הרצת השרת
app.listen(PORT, () => {
  console.log(`🔥 השרת רץ על פורט ${PORT}`);
});
