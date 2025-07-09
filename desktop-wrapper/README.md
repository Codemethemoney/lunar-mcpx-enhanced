# Lunar Claude Desktop Wrapper

## Overview
A desktop application that wraps Claude with Lunar's proactive tool management capabilities.

## Features

### 1. **Embedded Claude Interface**
- Full Claude.ai functionality in a desktop app
- Seamless integration with existing Claude account

### 2. **Prompt Interception**
- Intercepts all prompts before they reach Claude
- Real-time analysis with Lunar proxy
- Shows tool suggestions instantly

### 3. **Enhanced UI**
- **Status Bar**: Shows Lunar connection status and tool count
- **Sidebar**: 
  - Real-time tool analysis
  - Recent tool plans history
  - Complete tool registry browser
- **Input Overlay**: Enhanced input with analysis preview
- **Tool Plan Modal**: Review and modify tool plans

### 4. **Smart Features**
- Auto-detection of tool-related prompts
- Confidence scoring for tool suggestions
- One-click plan execution
- Fallback to normal Claude if Lunar is offline

## Installation

### Prerequisites
1. Lunar proxy server running (`npm run proxy` in parent directory)
2. Node.js 18+ installed

### Setup
```bash
# Install dependencies
cd desktop-wrapper
npm install

# Start the app
npm start
```

## Building for Distribution

```bash
# Build for current platform
npm run build

# Build for all platforms
npm run dist
```

Outputs will be in the `dist` directory.

## Usage

1. **Start Lunar Proxy** (in parent directory):
   ```bash
   npm run proxy
   ```

2. **Launch Lunar Claude**:
   ```bash
   npm start
   ```

3. **Use Claude normally** - Lunar automatically:
   - Intercepts your prompts
   - Analyzes for relevant tools
   - Enhances prompts with tool plans
   - Shows analysis in the sidebar

## UI Guide

### Status Indicators
- 🟢 Green dot = Lunar connected
- 🔴 Red dot = Lunar disconnected
- Tool count shows available MCP tools

### Keyboard Shortcuts
- `Cmd+Q` - Quit application
- `Cmd+R` - Reload interface
- `Cmd+Alt+I` - Toggle developer tools

### Tool Analysis Panel
Toggle with 🛠️ button to see:
- Current prompt analysis
- Suggested tools with confidence scores
- Recent tool execution plans
- Complete tool registry

## Architecture

```
User Input → Lunar Claude Wrapper → Lunar Proxy → Tool Analysis → Enhanced Prompt → Claude → Execution
```

The wrapper acts as a man-in-the-middle, providing:
- Zero-latency tool suggestions
- Context-aware enhancements
- Visual feedback on tool planning

## Troubleshooting

### Lunar Not Connected
1. Ensure proxy is running: `npm run proxy`
2. Check proxy health: Tools → Lunar Proxy Status
3. Restart both proxy and wrapper

### Claude Not Loading
1. Check internet connection
2. Clear app data: `rm -rf ~/Library/Application Support/lunar-claude-wrapper`
3. Restart application

### Tools Not Showing
1. Verify proxy is returning tool data
2. Check browser console for errors
3. Toggle Lunar processing off/on

## Development

### Project Structure
```
desktop-wrapper/
├── main.js          # Main Electron process
├── preload.js       # Secure bridge for IPC
├── renderer.js      # UI logic and Claude interaction
├── index.html       # Main window HTML
├── styles.css       # Application styles
└── assets/          # Icons and resources
```

### Adding Features
1. Main process changes → `main.js`
2. UI changes → `renderer.js` + `index.html`
3. IPC communication → `preload.js`

## Security

- Context isolation enabled
- No direct Node.js access in renderer
- Secure IPC communication only
- Claude runs in isolated webview
