import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_KEY;
const ASSISTANT_ID = 'asst_G5vNXFXqDXONqfgUwtYYpV1u';

async function runAssistant(messageText) {
  try {
    // שלב 1: צור Thread חדש
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
      },
    });

    const thread = await threadRes.json();
    const threadId = thread.id;

    // שלב 2: הוסף הודעה ל-thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content: messageText,
      }),
    });

    // שלב 3: הפעל את האסיסטנט
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      }),
    });

    const run = await runRes.json();
    const runId = run.id;

    // שלב 4: חכה עד שהריצה מסתיימת (לופ שמחכה)
    let status = run.status;
    while (status !== 'completed' && status !== 'failed') {
      const checkRun = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v1',
        }
      });
      const runStatus = await checkRun.json();
      status = runStatus.status;
      await new Promise(resolve => setTimeout(resolve, 1000)); // חכה שנייה
    }

    // שלב 5: קבל את ההודעה מהאסיסטנט
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1',
      }
    });

    const messages = await messagesRes.json();
    const assistantReply = messages.data.find(msg => msg.role === 'assistant');

    console.log('Assistant:', assistantReply?.content[0]?.text?.value);
    return assistantReply?.content[0]?.text?.value;

  } catch (error) {
    console.error('Assistant Error:', error);
  }
}

// קריאה לדוגמה:
runAssistant('שלום! אתה יכול לעזור לי עם משהו?');
