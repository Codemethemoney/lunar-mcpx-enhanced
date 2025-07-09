// Preload script - Secure bridge between renderer and main process
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lunarAPI', {
  // Analyze prompt with Lunar
  analyzePrompt: (prompt) => ipcRenderer.invoke('analyze-prompt', prompt),
  
  // Get tool plan details
  getToolPlan: (sessionId) => ipcRenderer.invoke('get-tool-plan', sessionId),
  
  // Check proxy health
  checkProxyHealth: () => ipcRenderer.invoke('check-proxy-health'),
  
  // Listen for events
  on: (channel, callback) => {
    const validChannels = [
      'lunar-connected',
      'lunar-status-changed',
      'tool-plan-ready',
      'show-tool-registry'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
