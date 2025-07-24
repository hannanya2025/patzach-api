import express from 'express';
import bodyParser from 'body-parser';
import OpenAI from 'openai';

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_GsVNXFqDX0NqfgbUwtYYpV1u';

// זיכרון זמני לכל session (לא פרסיסטנטי)
const sessions = {};

app.post('/api/patzach', async (req, res) => {
  try {
    const { history, sessionId } = req.body;

    if (!sessionId || !history || !Array.isArray(history)) {
      return res.status(400).json({ error: 'Missing sessionId or history array.' });
    }

    // יצירת thread חדש אם אין קיים
    if (!sessions[sessionId]) {
      const thread = await openai.beta.threads.create();
      sessions[sessionId] = thread.id;
    }

    const threadId = sessions[sessionId];

    // הוספת הודעה אחרונה מההיסטוריה
    const lastUserMessage = history[history.length - 1]?.content || '';
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: lastUserMessage,
    });

    // התחלת הרצה של האסיסטנט
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });

    // ממתין להשלמת ההרצה
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (runStatus.status === 'failed') {
      return res.status(500).json({ error: 'Run failed.' });
    }

    // שליפת ההודעה האחרונה של האסיסטנט
    const messages = await openai.beta.threads.messages.list(threadId, { limit: 5 });
    const lastAssistantMessage = messages.data.find(m => m.role === 'assistant');

    const reply = lastAssistantMessage?.content?.[0]?.text?.value || 'לא התקבלה תשובה.';

    res.json({ reply });
  } catch (err) {
    console.error('🔥 Error in /api/patzach:', err);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Patzach API running on port ${PORT}`);
});
