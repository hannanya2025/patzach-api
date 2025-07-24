import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// הגדרת CORS
app.use(cors({
  origin: ['https://www.25ros.com'], // או '*' אם אתה בפיתוח
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// הגדרת JSON parsing
app.use(bodyParser.json());

// בדיקת תקינות
app.get('/', (req, res) => {
  res.send('Assistant server is running 🎉');
});

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = 'asst_G5vNXFXqDXONqfgUwtYYpV1u';

app.post('/ask', async (req, res) => {
  const messageText = req.body.message;

  try {
    // יצירת thread חדש
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
      },
    });

    const thread = await threadRes.json();
    const threadId = thread.id;

    // שליחת הודעה ל-thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content: messageText,
      }),
    });

    // יצירת ריצה עבור האסיסטנט
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      }),
    });

    const run = await runRes.json();
    const runId = run.id;

    // המתנה לסיום הריצה
    let status = run.status;
    while (status !== 'completed' && status !== 'failed') {
      const checkRun = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'OpenAI-Beta': 'assistants=v1',
        }
      });
      const runStatus = await checkRun.json();
      status = runStatus.status;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // קבלת תשובת האסיסטנט
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
      }
    });

    const messages = await messagesRes.json();
    const assistantReply = messages.data.find(msg => msg.role === 'assistant');

    const replyText = assistantReply?.content[0]?.text?.value || '🤷‍♂️ No reply';

    res.json({ reply: replyText });

  } catch (error) {
    console.error('Assistant Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});
