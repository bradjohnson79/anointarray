// Minimal MCP-style HTTP tool server wrapping OpenAI
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

if (!process.env.OPENAI_API_KEY) {
  console.warn("[chatgpt-tools] OPENAI_API_KEY is not set. Set it in env before starting.");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function chat({ system, user }) {
  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user }
    ],
    temperature: 0.2
  });
  return resp.choices?.[0]?.message?.content ?? '';
}

app.get('/health', (req, res) => res.json({ ok: true, model: MODEL }));
app.get('/manifest', (req, res) => {
  res.json({
    schema: 'mcp+http-1.0',
    name: 'chatgpt-tools',
    description: 'ChatGPT-backed tools: summarize, rewrite, code_review',
    tools: [
      {
        name: 'summarize',
        description: 'Summarize text',
        input_schema: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string' },
            max_sentences: { type: 'number' }
          }
        }
      },
      {
        name: 'rewrite',
        description: 'Rewrite text with tone/length',
        input_schema: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string' },
            tone: { type: 'string' },
            length: { type: 'string', enum: ['short', 'medium', 'long'] }
          }
        }
      },
      {
        name: 'code_review',
        description: 'Lightweight code review',
        input_schema: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
            language: { type: 'string' }
          }
        }
      }
    ]
  });
});

app.post('/tools/summarize', async (req, res) => {
  try {
    const { text, max_sentences = 5 } = req.body || {};
    const out = await chat({
      system: `You are a precise summarizer. Output at most ${max_sentences} sentences, plain text.`,
      user: String(text || '').slice(0, 12000)
    });
    res.json({ ok: true, result: out.trim() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post('/tools/rewrite', async (req, res) => {
  try {
    const { text, tone = 'neutral', length = 'medium' } = req.body || {};
    const out = await chat({
      system: `Rewrite with tone="${tone}", length="${length}". Keep meaning. Return only the rewritten text.`,
      user: String(text || '').slice(0, 12000)
    });
    res.json({ ok: true, result: out.trim() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post('/tools/code_review', async (req, res) => {
  try {
    const { code, language = 'auto' } = req.body || {};
    const out = await chat({
      system: 'You are a senior code reviewer. Provide a tight review: correctness, security, performance, readability, and 3–5 concrete fixes. Use bullet points.',
      user: `Language: ${language}\n\nCode:\n${String(code || '').slice(0, 12000)}`
    });
    res.json({ ok: true, result: out.trim() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const PORT = process.env.PORT || 4312;
app.listen(PORT, () => {
  console.log(`ChatGPT MCP tool server listening on http://localhost:${PORT}`);
});