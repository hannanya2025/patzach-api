import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = 'asst_GsVNXFqDX0NqfgbUwtYYpV1u'; // זה האסיסטנט שלך - יואב

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// לשמור שיחות לפי session
const sessions = {};

app.post('/api/patzach', async (req, res) => {
  try {
    const { history, sessionId } = req.body;

    if (!sessions[sessionId]) {
      // ליצור thread חדש לכל session
      const thread = await openai.beta.threads.create();
      sessions[sessionId] = thread.id;
    }

    const threadId = sessions[sessionId];

    // להוסיף הודעה חדשה מהמשתמש
    const lastMessage = history[history.length - 1]?.content || '';
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: lastMessage,
    });

    // להריץ את האסיסטנט
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });

    // לחכות עד שההרצה מסתיימת
    let runStatus;
    do {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status !== 'completed');

    // להביא את ההודעה האחרונה שנשלחה ע"י האסיסטנט
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastResponse = messages.data.find((msg) => msg.role === 'assistant');

    res.json({ reply: lastResponse.content[0].text.value });
  } catch (error) {
    console.error('Error with OpenAI Assistant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Patzach API running on port 3000');
});
