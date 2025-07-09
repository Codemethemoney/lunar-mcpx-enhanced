# Lunar Proxy Mode - Always-On Tool Management

## Overview
This experimental feature allows Lunar to run as a background service that intercepts and pre-processes all prompts before they reach Claude.

## How It Works

```
Traditional Flow:
User → Claude → Lunar (when called) → Tools

Proxy Flow:
User → Lunar Proxy → Pre-analyzed prompt → Claude → Tools (already planned)
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd /Users/garyoleary/.config/lunar-mcpx-enhanced
npm install
```

### 2. Start Lunar Proxy Server
```bash
npm run proxy
# or for development with auto-reload:
npm run dev:proxy
```

You should see:
```
╔════════════════════════════════════════════╗
║        Lunar Proxy Server Started          ║
║                                            ║
║  HTTP API: http://localhost:8080           ║
║  WebSocket: ws://localhost:8081            ║
║                                            ║
║  Mode: Proactive Tool Management           ║
║  Status: Ready to intercept prompts        ║
╚════════════════════════════════════════════╝
```

### 3. Install Browser Extension (Optional)
1. Open Chrome/Edge/Firefox
2. Go to Extensions → Manage Extensions
3. Enable "Developer Mode"
4. Click "Load unpacked"
5. Select `/Users/garyoleary/.config/lunar-mcpx-enhanced/browser-extension`

### 4. Use Claude Desktop
With the proxy running, you can:
- Send prompts to the proxy first via API
- Use the browser extension for automatic interception
- Or manually enhance prompts

## API Usage

### Pre-analyze a prompt:
```bash
curl -X POST http://localhost:8080/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a Docker container for my Node.js app",
    "sessionId": "session123"
  }'
```

Response:
```json
{
  "enhancedPrompt": "[LUNAR-PREPROCESSED]...",
  "sessionId": "session123",
  "toolsIdentified": 3,
  "confidence": 0.95
}
```

### Get prepared tool plan:
```bash
curl http://localhost:8080/plan/session123
```

## Benefits
- **Zero latency**: Tool plans ready before Claude processes
- **Better context**: Lunar sees all prompts, builds understanding
- **Learning**: Improves suggestions over time
- **Optimization**: Can batch and optimize tool calls

## Current Limitations
- Browser extension only works with web Claude (not desktop app)
- Requires manual integration without extension
- Experimental feature - not production ready

## Future Enhancements
- Native Claude Desktop integration
- Advanced NLP for better prompt understanding
- Tool execution monitoring and optimization
- Cross-conversation context awareness
