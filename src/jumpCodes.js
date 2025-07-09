// jumpCodes.js - Jump code navigation for quick tool access
/**
 * Provides jump code functionality for direct tool navigation
 * Example: [TOOL:docker-1] maps to docker-mcp:create-container
 */

export class JumpCodeNavigator {
  constructor(tools) {
    this.tools = tools;
    this.jumpCodeMap = this.buildJumpCodeMap();
    this.reverseMap = this.buildReverseMap();
  }

  /**
   * Build jump code mappings from tools
   */
  buildJumpCodeMap() {
    const map = new Map();
    const categoryCount = {};

    this.tools.forEach(tool => {
      const category = tool.category || 'misc';
      const count = categoryCount[category] || 0;
      categoryCount[category] = count + 1;
      
      const jumpCode = `${category.toLowerCase()}-${count + 1}`;
      map.set(jumpCode, tool.name);
    });

    return map;
  }
  /**
   * Build reverse mapping (tool name to jump code)
   */
  buildReverseMap() {
    const map = new Map();
    for (const [jumpCode, toolName] of this.jumpCodeMap) {
      map.set(toolName, jumpCode);
    }
    return map;
  }

  /**
   * Find tool by jump code pattern in text
   * @param {string} text - Text containing potential jump codes
   * @returns {Object|null} Tool information or null
   */
  findByJumpCode(text) {
    const pattern = /\[TOOL:([a-z]+-\d+)\]/i;
    const match = text.match(pattern);
    
    if (match && match[1]) {
      const toolName = this.jumpCodeMap.get(match[1].toLowerCase());
      if (toolName) {
        return {
          name: toolName,
          jumpCode: match[1],
          matchedPattern: match[0]
        };
      }
    }
    
    return null;
  }
  /**
   * Get jump code for a tool name
   * @param {string} toolName - Name of the tool
   * @returns {string|null} Jump code or null
   */
  getJumpCode(toolName) {
    return this.reverseMap.get(toolName) || null;
  }

  /**
   * List all jump codes
   * @returns {Array} Array of jump code mappings
   */
  listAllJumpCodes() {
    return Array.from(this.jumpCodeMap.entries()).map(([code, tool]) => ({
      jumpCode: code,
      tool: tool,
      pattern: `[TOOL:${code}]`
    }));
  }

  /**
   * Search for jump codes by pattern
   * @param {string} pattern - Search pattern
   * @returns {Array} Matching jump codes
   */
  searchJumpCodes(pattern) {
    const regex = new RegExp(pattern, 'i');
    return this.listAllJumpCodes().filter(item => 
      regex.test(item.jumpCode) || regex.test(item.tool)
    );
  }
}