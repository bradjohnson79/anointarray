# ChatGPT MCP Tools Server

A ChatGPT-backed MCP server that provides three essential AI tools:
- **summarize**: Summarize text with configurable length
- **rewrite**: Rewrite text with specified tone and length  
- **code_review**: Lightweight code review with improvement suggestions

## Setup

1. **Install dependencies:**
   ```bash
   cd mcp/servers/chatgpt-tools
   npm install
   ```

2. **Set up environment:**
   ```bash
   export OPENAI_API_KEY="your_openai_api_key_here"
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Server will listen on `http://localhost:4311`

## Usage

### Summarize Text
```bash
curl -s -X POST http://localhost:4311/tools/summarize \
  -H 'Content-Type: application/json' \
  -d '{"text":"Long text to summarize...","max_sentences":3}'
```

### Rewrite Text  
```bash
curl -s -X POST http://localhost:4311/tools/rewrite \
  -H 'Content-Type: application/json' \
  -d '{"text":"Original text","tone":"professional","length":"short"}'
```

### Code Review
```bash
curl -s -X POST http://localhost:4311/tools/code_review \
  -H 'Content-Type: application/json' \
  -d '{"language":"typescript","code":"function add(a:number,b:number){return a+b}"}'
```

## Configuration

Environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: Model to use (default: gpt-4o-mini)
- `PORT`: Server port (default: 4311)

## Claude Code Integration

To register with Claude Code, use:
```bash
claude mcp add chatgpt-tools --transport http --url http://localhost:4311
```

Or add to Claude settings manually:
- Name: chatgpt-tools
- Type: http  
- URL: http://localhost:4311
- Manifest: http://localhost:4311/manifest