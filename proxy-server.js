// Lunar Proxy Server - Always-On Tool Management
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { LunarMCPEnhanced } from './src/server.js';

class LunarProxyServer {
  constructor(port = 8080) {
    this.port = port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    
    // Initialize Lunar analyzer
    this.lunar = new LunarMCPEnhanced();
    this.promptQueue = new Map();
    this.toolPlans = new Map();
    
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'running', 
        mode: 'proactive',
        plansReady: this.toolPlans.size 
      });
    });

    // Pre-analyze prompt endpoint
    this.app.post('/analyze', async (req, res) => {
      const { prompt, sessionId } = req.body;
      
      console.log(`[LUNAR-PROXY] Analyzing: "${prompt}"`);
      
      // Start analysis immediately
      const analysis = await this.analyzePrompt(prompt);
      const toolPlan = await this.buildToolPlan(analysis);
      
      // Store plan for Claude
      this.toolPlans.set(sessionId, {
        prompt,
        analysis,
        toolPlan,
        timestamp: Date.now()
      });
      
      // Return enhanced prompt for Claude
      res.json({
        enhancedPrompt: this.createEnhancedPrompt(prompt, toolPlan),
        sessionId,
        toolsIdentified: toolPlan.length,
        confidence: analysis.confidence
      });
    });

    // Get prepared tool plan
    this.app.get('/plan/:sessionId', (req, res) => {
      const plan = this.toolPlans.get(req.params.sessionId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      res.json(plan);
    });
  }

  setupWebSocket() {
    this.wss = new WebSocketServer({ port: this.port + 1 });
    
    this.wss.on('connection', (ws) => {
      console.log('[LUNAR-PROXY] WebSocket client connected');
      
      ws.on('message', async (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'PROMPT_INTERCEPTED') {
          // Real-time prompt analysis
          const result = await this.handleInterceptedPrompt(data);
          ws.send(JSON.stringify(result));
        }
      });
    });
  }

  async analyzePrompt(prompt) {
    // Use Lunar's analysis capabilities
    const result = await this.lunar.performAnalysis(prompt);
    return result;
  }

  async buildToolPlan(analysis) {
    const plan = [];
    
    if (analysis.primaryTool) {
      // Build execution steps
      plan.push({
        step: 1,
        tool: analysis.primaryTool,
        confidence: analysis.confidence,
        params: this.extractParams(analysis.primaryTool, analysis)
      });
    }
    
    // Add suggested follow-up tools
    analysis.suggestions?.forEach((tool, index) => {
      plan.push({
        step: index + 2,
        tool: tool,
        confidence: 0.7,
        params: {},
        optional: true
      });
    });
    
    return plan;
  }

  createEnhancedPrompt(originalPrompt, toolPlan) {
    return `[LUNAR-PREPROCESSED]
The user wants to: ${originalPrompt}

I've pre-analyzed this request and prepared the following tool execution plan:

${toolPlan.map(step => 
  `Step ${step.step}: Use ${step.tool} (confidence: ${step.confidence})`
).join('\n')}

Please execute these tools in sequence to fulfill the user's request.
[END-LUNAR]

${originalPrompt}`;
  }

  extractParams(tool, analysis) {
    // Extract parameters based on tool patterns
    // This would be enhanced with NLP in production
    return {};
  }

  async handleInterceptedPrompt(data) {
    const { prompt, sessionId } = data;
    const analysis = await this.analyzePrompt(prompt);
    const toolPlan = await this.buildToolPlan(analysis);
    
    return {
      type: 'TOOL_PLAN_READY',
      sessionId,
      toolPlan,
      enhancedPrompt: this.createEnhancedPrompt(prompt, toolPlan)
    };
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`
╔════════════════════════════════════════════╗
║        Lunar Proxy Server Started          ║
║                                            ║
║  HTTP API: http://localhost:${this.port}       ║
║  WebSocket: ws://localhost:${this.port + 1}        ║
║                                            ║
║  Mode: Proactive Tool Management           ║
║  Status: Ready to intercept prompts        ║
╚════════════════════════════════════════════╝
      `);
    });
  }
}

// Start the proxy if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const proxy = new LunarProxyServer();
  proxy.start();
}

export { LunarProxyServer };
