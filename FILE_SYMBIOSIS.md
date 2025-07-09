# 🌙 Lunar MCP Enhanced - File Symbiosis Documentation

## Overview
This document explains how all files in the lunar-mcpx-enhanced project work together to create a cohesive MCP tool discovery system.

## File Structure & Relationships

### Core Server Files
1. **src/server.js** - Main entry point
   - Imports all modules and initializes the MCP server
   - Sets up request handlers for tool discovery
   - Connects to Claude Desktop via StdioServerTransport
   - Dependencies: All other src/ files, MCP SDK

2. **src/formatter.js** - Response formatting
   - Ensures all responses are MCP-compliant
   - Used by: server.js, chainExecutor.js
   - Critical for fixing the original response format issue

3. **src/jumpCodes.js** - Quick navigation
   - Maps jump codes to tool names (e.g., [TOOL:github-1])
   - Used by: server.js for rapid tool access
   - Provides: JumpCodeNavigator class

4. **src/chainExecutor.js** - Sequential execution
   - Handles tool chains like [CHAIN:git-create→file-write→git-commit]
   - Used by: server.js when detecting chain patterns
   - Dependencies: formatter.js

5. **src/semanticCache.js** - Performance optimization
   - Caches similar queries for instant responses
   - Used by: server.js for all analyze_request calls
   - Config: Reads from lunar-mcp-config.yaml

6. **src/patternLearner.js** - AI learning
   - Learns from usage patterns to improve suggestions
   - Used by: server.js to log and retrieve patterns
   - Stores: Tool usage history and patterns

### Configuration Files
1. **config/lunar-mcp-config.yaml**
   - Central configuration for all modules
   - Read by: server.js on startup
   - Configures: Cache TTL, thresholds, pattern learning

2. **package.json**
   - Defines project metadata and dependencies
   - Main entry: Points to src/server.js
   - Scripts: start, proxy, test, dev modes

3. **claude_desktop_config.json** (External)
   - Located in: ~/Library/Application Support/Claude/
   - References: lunar-mcpx-enhanced server
   - Command: Points to Node.js and src/server.js

### Optional Components
1. **proxy-server.js** - HTTP proxy mode
   - Alternative way to use Lunar via HTTP
   - Runs on port 8080
   - Independent of main MCP server

2. **start-lunar.sh** - Quick start script
   - Convenience wrapper for starting services
   - Can launch proxy and desktop wrapper

3. **browser-extension/** - Chrome extension
   - Intercepts Claude web prompts
   - Requires proxy server running

4. **desktop-wrapper/** - Electron app
   - Embeds Claude with Lunar integration
   - Alternative to using Claude Desktop

## Data Flow

```
1. Claude Desktop → stdio → server.js
2. server.js → setupHandlers() → ListToolsRequestSchema
3. User request → analyze_request tool
4. analyze_request → checks:
   - jumpCodes.js (for [TOOL:x] patterns)
   - chainExecutor.js (for [CHAIN:x] patterns)
   - semanticCache.js (for cached responses)
   - patternLearner.js (for learned patterns)
5. Response → formatter.js → MCP-compliant format
6. MCP-compliant response → Claude Desktop
```

## Key Fixes Applied

1. **MCP SDK Integration**
   - Added proper schema imports (CallToolRequestSchema, ListToolsRequestSchema)
   - Fixed server initialization with capabilities
   - Updated request handlers to use MCP schemas

2. **Response Formatting**
   - All responses go through formatter.js
   - Ensures `content: [{type: "text", text: "..."}]` format
   - Prevents "Method not found" errors

3. **Handler Setup Order**
   - setupHandlers() called BEFORE server.connect()
   - Ensures handlers are registered properly

## GitHub Repository Structure
The GitHub repository mirrors the local structure exactly:
- All source files in src/
- Configuration in config/
- Optional components in their directories
- Clean structure with no junk files

## Symbiosis Summary
- **Server files** depend on each other through imports
- **Configuration** is centralized in YAML
- **Claude Desktop** connects via stdio protocol
- **All responses** are properly formatted for MCP
- **Optional components** enhance but don't break core functionality
- **GitHub and local** files are perfectly synchronized

This creates a complete, working MCP tool that Claude can use to analyze prompts and suggest appropriate tools from your 26+ configured MCP servers.
