// server.js - Main MCP server with all enhancements
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { formatResponse, formatError } from './formatter.js';
import { JumpCodeNavigator } from './jumpCodes.js';
import { ToolChainExecutor } from './chainExecutor.js';
import { SemanticCache } from './semanticCache.js';
import { PatternLearner } from './patternLearner.js';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

class LunarMCPEnhanced {
  constructor() {
    this.config = this.loadConfig();
    this.tools = this.loadAllTools();
    this.jumpNav = new JumpCodeNavigator(this.tools);
    this.chainExecutor = new ToolChainExecutor(this);
    this.cache = new SemanticCache(this.config.cache);
    this.patternLearner = new PatternLearner();
    this.server = new Server({
      name: 'lunar-mcpx-enhanced',
      version: '2.0.0'
    });
  }

  loadConfig() {    try {
      const configPath = join(__dirname, '../config/lunar-mcp-config.yaml');
      const configFile = readFileSync(configPath, 'utf8');
      return parse(configFile);
    } catch (error) {
      // Return default config
      return {
        cache: {
          ttl: 3600,
          threshold: 0.85,
          maxSize: 1000
        },
        patterns: {
          maxHistory: 1000
        }
      };
    }
  }

  loadAllTools() {
    // In production, this would load from the actual MCP registry
    // For now, return a sample set
    return [
      { name: 'github:create_repository', category: 'github' },
      { name: 'github:create_branch', category: 'github' },
      { name: 'docker-mcp:create-container', category: 'docker' },
      { name: 'filesystem:file_operation', category: 'file' },
      { name: 'command-runner:run_command', category: 'system' },
      // Add more tools as needed
    ];
  }
  setupHandlers() {
    // Tools list handler - required by MCP
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'analyze_request',
            description: 'Analyzes natural language requests and suggests appropriate MCP tools from all 26 available servers',
            inputSchema: {
              type: 'object',
              properties: {
                request: {
                  type: 'string',
                  description: 'The natural language request to analyze'
                }
              },
              required: ['request']
            }
          },
          {
            name: 'list_all_tools',
            description: 'Lists all 26 MCP tools with their patterns and descriptions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Tool call handler - required by MCP
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request;
      
      try {
        if (name === 'list_all_tools') {
          const result = {
            tools: this.tools,
            totalCount: this.tools.length,
            categories: this.getToolCategories(),
            jumpCodes: this.jumpNav.listAllJumpCodes()
          };
          return formatResponse(result);
        }
        
        if (name === 'analyze_request') {
          const { request } = args;
          const startTime = Date.now();
          
          // Check for chain execution
          if (request.includes('[CHAIN:')) {
            const chainResult = await this.chainExecutor.executeChain(request);
            return formatResponse(chainResult);
          }
          
          // Check cache first
          const cached = await this.cache.getCachedOrCompute(
            request,
            async () => await this.performAnalysis(request)
          );
          
          // Log usage for pattern learning
          const duration = Date.now() - startTime;
          if (cached.primaryTool) {
            this.patternLearner.logToolUsage(
              cached.primaryTool,
              request,
              true,
              duration
            );
          }
          
          return formatResponse(cached);
        }
        
        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return formatError(error);
      }
    });
  }

  async performAnalysis(request) {
    // Check for jump codes first
    const jumpTool = this.jumpNav.findByJumpCode(request);
    if (jumpTool) {
      return {
        primaryTool: jumpTool.name,
        confidence: 1.0,
        reason: 'Direct jump code match',
        jumpCode: jumpTool.jumpCode,
        suggestions: []
      };
    }
    
    // Get pattern-based suggestions
    const patternSuggestions = this.patternLearner.getSuggestions(request);    
    // Simple semantic matching (in production, use better NLP)
    const matchedTools = this.findMatchingTools(request);
    
    // Combine results
    const primaryTool = matchedTools[0] || patternSuggestions[0]?.tool;
    
    return {
      primaryTool: primaryTool,
      confidence: primaryTool ? 0.85 : 0,
      reason: 'Semantic and pattern analysis',
      suggestions: [
        ...matchedTools.slice(1, 3),
        ...patternSuggestions.map(s => s.tool)
      ].slice(0, 5)
    };
  }

  findMatchingTools(request) {
    const requestLower = request.toLowerCase();
    const matches = [];
    
    this.tools.forEach(tool => {
      const toolLower = tool.name.toLowerCase();
      const category = tool.category.toLowerCase();
      
      if (requestLower.includes(category) || 
          requestLower.includes(toolLower.split(':')[1]?.replace(/_/g, ' '))) {
        matches.push(tool.name);
      }
    });
    
    return matches;
  }
  getToolCategories() {
    const categories = new Map();
    
    this.tools.forEach(tool => {
      const category = tool.category || 'misc';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(tool.name);
    });
    
    return Object.fromEntries(categories);
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.setupHandlers(); // Set up handlers after connection
    console.error('Lunar MCP Enhanced v2.0.0 started');
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new LunarMCPEnhanced();
  server.start().catch(console.error);
}

export default LunarMCPEnhanced;
export { LunarMCPEnhanced };