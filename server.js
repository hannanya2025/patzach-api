import express from 'express';
import bodyParser from 'body-parser';
import { OpenAI } from 'openai';

const app = express();
app.use(bodyParser.json());

// הגדר את ה־API Key שלך כאן
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// מזהה האסיסטנט שלך – יואב
const ASSISTANT_ID = 'asst_GsVNXFqDX0NqfgbUwtYYpV1u';

// ניהול sessionIds → threadIds
const sessions = {};

app.post('/api/patzach', async (req, res) => {
  try {
    const { history, sessionId } = req.body;

    if (!history || !sessionId) {
      return res.status(400).json({ error: 'Missing history or sessionId' });
    }

    // צור Thread חדש אם אין כזה
    if (!sessions[sessionId]) {
      const thread = await openai.beta.threads.create();
      sessions[sessionId] = thread.id;
    }

    const threadId = sessions[sessionId];

    // הוסף את ההודעה האחרונה של המשתמש ל-thread
    const userMessage = history[history.length - 1]?.content || '';
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: userMessage,
    });

    // צור הפעלה של האסיסטנט
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });

    // המתן לסיום הריצה
    let runStatus;
    do {
      await new Promise((r) => setTimeout(r, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status !== 'completed');

    // קבל את התגובה האחרונה של האסיסטנט
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantReply = messages.data.find(
      (msg) => msg.role === 'assistant'
    );

    const replyText = assistantReply?.content?.[0]?.text?.value || '';

    res.json({ reply: replyText });
  } catch (err) {
    console.error('OpenAI Assistant Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('✅ Patzach API running on port 3000');
});
