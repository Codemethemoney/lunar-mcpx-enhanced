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
