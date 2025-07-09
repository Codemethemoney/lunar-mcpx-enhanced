// chainExecutor.js - Tool chain execution functionality
/**
 * Executes sequential tool chains
 * Example: [CHAIN:git-create→file-write→git-commit→git-push]
 */

export class ToolChainExecutor {
  constructor(mcpServer) {
    this.server = mcpServer;
    this.executionHistory = [];
  }

  /**
   * Parse chain notation into executable steps
   * @param {string} chainNotation - Chain notation string
   * @returns {Array} Array of tool names
   */
  parseChain(chainNotation) {
    const pattern = /\[CHAIN:([\w-→]+)\]/;
    const match = chainNotation.match(pattern);
    
    if (match && match[1]) {
      return match[1].split('→').map(step => step.trim());
    }
    
    return [];
  }

  /**
   * Execute a tool chain
   * @param {string} chainNotation - Chain notation
   * @param {Object} context - Execution context
   * @returns {Object} Chain execution result
   */  async executeChain(chainNotation, context = {}) {
    const steps = this.parseChain(chainNotation);
    const results = [];
    const startTime = Date.now();
    
    try {
      for (const [index, step] of steps.entries()) {
        const tool = this.findToolByStep(step);
        if (!tool) {
          throw new Error(`Tool not found for step: ${step}`);
        }
        
        const stepResult = {
          step: index + 1,
          tool: tool.name,
          status: 'executing'
        };
        
        // Here you would execute the actual tool
        // For now, we'll simulate it
        stepResult.status = 'completed';
        stepResult.duration = Math.random() * 1000;
        
        results.push(stepResult);
      }
      
      const execution = {
        chain: chainNotation,
        steps: results,
        totalDuration: Date.now() - startTime,
        status: 'completed'
      };
      
      this.executionHistory.push(execution);
      return execution;
      
    } catch (error) {
      const execution = {
        chain: chainNotation,
        steps: results,
        error: error.message,
        totalDuration: Date.now() - startTime,
        status: 'failed'
      };
      
      this.executionHistory.push(execution);
      throw error;
    }
  }

  /**
   * Find tool by step name
   * @param {string} step - Step name
   * @returns {Object|null} Tool or null
   */
  findToolByStep(step) {
    // Try exact match first
    let tool = this.server.tools.find(t => 
      t.name.toLowerCase().includes(step.toLowerCase())
    );
    
    // Try jump code if no exact match
    if (!tool) {
      const jumpResult = this.server.jumpNav.findByJumpCode(`[TOOL:${step}]`);
      if (jumpResult) {        tool = this.server.tools.find(t => t.name === jumpResult.name);
      }
    }
    
    return tool;
  }

  /**
   * Get execution history
   * @param {number} limit - Maximum number of executions to return
   * @returns {Array} Recent executions
   */
  getHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Validate a chain before execution
   * @param {string} chainNotation - Chain to validate
   * @returns {Object} Validation result
   */
  validateChain(chainNotation) {
    const steps = this.parseChain(chainNotation);
    const validation = {
      valid: true,
      steps: [],
      errors: []
    };
    
    for (const step of steps) {
      const tool = this.findToolByStep(step);
      if (tool) {        validation.steps.push({
          step: step,
          tool: tool.name,
          valid: true
        });
      } else {
        validation.valid = false;
        validation.errors.push(`Unknown step: ${step}`);
        validation.steps.push({
          step: step,
          tool: null,
          valid: false
        });
      }
    }
    
    return validation;
  }
}