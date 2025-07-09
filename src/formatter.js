// formatter.js - Critical fix for MCP response format
/**
 * The core issue with lunar-mcpx-enhanced is that it returns raw data
 * instead of MCP-compliant responses. This module fixes that.
 */

/**
 * Format a response for MCP compliance
 * @param {any} data - The data to format
 * @returns {Object} MCP-compliant response
 */
export function formatResponse(data) {
  return {
    content: [{
      type: "text",
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    }]
  };
}

/**
 * Format an error for MCP compliance
 * @param {Error|string} error - The error to format
 * @returns {Object} MCP-compliant error response
 */
export function formatError(error) {
  return {
    content: [{
      type: "text", 
      text: `Error: ${error.message || error}`
    }]
  };
}

/**
 * Format multiple responses as a single MCP response
 * @param {Array} responses - Array of responses to format
 * @returns {Object} MCP-compliant multi-response
 */
export function formatMultiResponse(responses) {
  return {
    content: responses.map(resp => ({
      type: "text",
      text: typeof resp === 'string' ? resp : JSON.stringify(resp, null, 2)
    }))
  };
}

/**
 * Format a tool suggestion response
 * @param {Object} suggestion - Tool suggestion object
 * @returns {Object} MCP-compliant tool suggestion
 */
export function formatToolSuggestion(suggestion) {
  const { primaryTool, alternativeTools, confidence, reason, jumpCode } = suggestion;
  
  const response = {
    primaryTool,
    confidence,
    reason,
    ...(jumpCode && { jumpCode }),
    ...(alternativeTools?.length > 0 && { alternatives: alternativeTools })
  };
  
  return formatResponse(response);
}
