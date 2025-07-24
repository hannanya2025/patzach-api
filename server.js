import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// בדיקת תקינות פשוטה
app.get('/', (req, res) => {
  res.send('Assistant server is running 🎉');
});

const OPENAI_KEY = process.env.OPENAI_KEY;
const ASSISTANT_ID = 'asst_G5vNXFXqDXONqfgUwtYYpV1u';

app.post('/ask', async (req, res) => {
  const messageText = req.body.message;

  try {
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

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});
