// patternLearner.js - Learn and suggest based on usage patterns
/**
 * Tracks tool usage patterns to provide intelligent suggestions
 */

export class PatternLearner {
  constructor() {
    this.usageHistory = [];
    this.toolFrequency = new Map();
    this.toolSequences = new Map();
    this.contextPatterns = new Map();
    this.maxHistorySize = 1000;
  }

  /**
   * Log tool usage
   * @param {string} toolName - Name of the tool used
   * @param {string} context - Context/query that led to tool selection
   * @param {boolean} wasAccepted - Whether user accepted the suggestion
   * @param {number} responseTime - Time taken to respond
   */
  logToolUsage(toolName, context, wasAccepted = true, responseTime = 0) {
    const usage = {
      tool: toolName,
      context: context,
      accepted: wasAccepted,
      responseTime: responseTime,
      timestamp: Date.now()
    };
    
    this.usageHistory.push(usage);
        
    // Update frequency
    if (wasAccepted) {
      this.toolFrequency.set(toolName, 
        (this.toolFrequency.get(toolName) || 0) + 1
      );
    }
    
    // Update sequences
    if (this.usageHistory.length > 1) {
      const previousTool = this.usageHistory[this.usageHistory.length - 2].tool;
      const sequence = `${previousTool}→${toolName}`;
      this.toolSequences.set(sequence,
        (this.toolSequences.get(sequence) || 0) + 1
      );
    }
    
    // Update context patterns
    const words = context.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        if (!this.contextPatterns.has(word)) {
          this.contextPatterns.set(word, new Map());
        }
        const toolMap = this.contextPatterns.get(word);
        toolMap.set(toolName, (toolMap.get(toolName) || 0) + 1);
      }
    });
    
    // Maintain history size
    if (this.usageHistory.length > this.maxHistorySize) {
      this.usageHistory.shift();
    }
  }
  /**
   * Get tool suggestions based on context
   * @param {string} context - Current context/query
   * @param {number} limit - Maximum suggestions
   * @returns {Array} Suggested tools
   */
  getSuggestions(context, limit = 5) {
    const suggestions = new Map();
    
    // Context-based suggestions
    const words = context.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (this.contextPatterns.has(word)) {
        const toolMap = this.contextPatterns.get(word);
        toolMap.forEach((count, tool) => {
          suggestions.set(tool, (suggestions.get(tool) || 0) + count);
        });
      }
    });
    
    // Sort by score
    return Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tool, score]) => ({
        tool: tool,
        score: score,
        confidence: Math.min(score / 10, 1)
      }));
  }
  /**
   * Get next tool predictions based on previous tool
   * @param {string} previousTool - Previously used tool
   * @returns {Array} Predicted next tools
   */
  predictNextTools(previousTool) {
    const predictions = [];
    
    this.toolSequences.forEach((count, sequence) => {
      if (sequence.startsWith(previousTool + '→')) {
        const nextTool = sequence.split('→')[1];
        predictions.push({
          tool: nextTool,
          count: count,
          probability: count / this.usageHistory.length
        });
      }
    });
    
    return predictions.sort((a, b) => b.count - a.count);
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage stats
   */
  getStats() {
    return {
      totalUsage: this.usageHistory.length,
      uniqueTools: this.toolFrequency.size,
      topTools: Array.from(this.toolFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      uniqueSequences: this.toolSequences.size,
      contextWords: this.contextPatterns.size
    };
  }
}