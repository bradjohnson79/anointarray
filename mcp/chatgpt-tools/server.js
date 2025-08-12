const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4311;

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    server: 'ChatGPT Tools MCP Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// MCP manifest endpoint
app.get('/manifest', (req, res) => {
  res.json({
    name: "chatgpt-tools",
    version: "1.0.0",
    description: "ChatGPT-backed MCP server providing summarize, rewrite, and code_review tools",
    tools: [
      {
        name: "summarize",
        description: "Summarize text with configurable sentence limit",
        parameters: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to summarize"
            },
            max_sentences: {
              type: "number",
              description: "Maximum number of sentences in summary",
              default: 5
            }
          },
          required: ["text"]
        }
      },
      {
        name: "rewrite",
        description: "Rewrite text with specified tone and length",
        parameters: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to rewrite"
            },
            tone: {
              type: "string",
              description: "Tone for rewriting",
              enum: ["formal", "casual", "professional", "friendly", "technical", "neutral"],
              default: "neutral"
            },
            length: {
              type: "string",
              description: "Target length for rewritten text",
              enum: ["short", "medium", "long"],
              default: "medium"
            }
          },
          required: ["text"]
        }
      },
      {
        name: "code_review",
        description: "Lightweight code review with improvement suggestions",
        parameters: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Code to review"
            },
            language: {
              type: "string",
              description: "Programming language",
              default: "auto"
            }
          },
          required: ["code"]
        }
      }
    ]
  });
});

// Summarize tool
app.post('/tools/summarize', async (req, res) => {
  try {
    const { text, max_sentences = 5 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Please summarize the following text in exactly ${max_sentences} sentences or fewer. Be concise and capture the key points:

${text}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });

    const summary = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      summary,
      original_length: text.length,
      summary_length: summary.length,
      sentences: max_sentences
    });
    
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ 
      error: 'Failed to summarize text',
      details: error.message 
    });
  }
});

// Rewrite tool
app.post('/tools/rewrite', async (req, res) => {
  try {
    const { text, tone = 'neutral', length = 'medium' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const lengthInstructions = {
      short: 'Make it concise and brief',
      medium: 'Keep it at a similar length',
      long: 'Expand and provide more detail'
    };

    const prompt = `Please rewrite the following text with a ${tone} tone. ${lengthInstructions[length]}:

${text}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    });

    const rewritten = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      original: text,
      rewritten,
      tone,
      length,
      original_length: text.length,
      rewritten_length: rewritten.length
    });
    
  } catch (error) {
    console.error('Rewrite error:', error);
    res.status(500).json({ 
      error: 'Failed to rewrite text',
      details: error.message 
    });
  }
});

// Code review tool
app.post('/tools/code_review', async (req, res) => {
  try {
    const { code, language = 'auto' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code parameter is required' });
    }

    const prompt = `Please review the following ${language !== 'auto' ? language : ''} code and provide:
1. Overall assessment (Good/Needs Improvement/Critical Issues)
2. Specific issues found
3. Improvement suggestions
4. Security considerations if applicable

Code:
\`\`\`
${code}
\`\`\``;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    });

    const review = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      code,
      language,
      review,
      code_length: code.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Code review error:', error);
    res.status(500).json({ 
      error: 'Failed to review code',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// Start server
app.listen(port, () => {
  console.log(`🤖 ChatGPT Tools MCP Server running on port ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(`📋 Manifest: http://localhost:${port}/manifest`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Warning: OPENAI_API_KEY not set. Tools will not function.');
  } else {
    console.log('✅ OpenAI API key configured');
  }
});