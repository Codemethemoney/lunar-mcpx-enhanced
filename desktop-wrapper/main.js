// Lunar Claude Wrapper - Main Process
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');

class LunarClaudeWrapper {
  constructor() {
    this.mainWindow = null;
    this.lunarProxyUrl = 'http://localhost:8080';
    this.lunarWsUrl = 'ws://localhost:8081';
    this.ws = null;
    this.sessionId = Date.now().toString();
    this.isLunarEnabled = true;
    
    this.setupHandlers();
  }

  async createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      title: 'Lunar Claude - Enhanced with Proactive Tools',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webviewTag: true
      },
      icon: path.join(__dirname, 'assets', 'icon.png')
    });

    // Create custom menu
    this.createMenu();

    // Load the wrapper interface
    this.mainWindow.loadFile('index.html');

    // Connect to Lunar proxy
    this.connectToLunarProxy();

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      if (this.ws) this.ws.close();
    });
  }

  createMenu() {
    const template = [
      {
        label: 'Lunar Claude',
        submenu: [
          { label: 'About Lunar Claude', click: () => this.showAbout() },
          { type: 'separator' },
          { label: 'Quit', accelerator: 'Cmd+Q', click: () => app.quit() }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Toggle Lunar Processing',
            type: 'checkbox',
            checked: this.isLunarEnabled,
            click: (item) => {
              this.isLunarEnabled = item.checked;
              this.mainWindow.webContents.send('lunar-status-changed', this.isLunarEnabled);
            }
          },
          {
            label: 'View Tool Registry',
            click: () => this.mainWindow.webContents.send('show-tool-registry')
          },
          { type: 'separator' },
          {
            label: 'Lunar Proxy Status',
            click: () => this.checkProxyStatus()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'Cmd+R', click: () => this.mainWindow.reload() },
          { label: 'Toggle DevTools', accelerator: 'Cmd+Alt+I', click: () => this.mainWindow.webContents.toggleDevTools() }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  connectToLunarProxy() {
    this.ws = new WebSocket(this.lunarWsUrl);
    
    this.ws.on('open', () => {
      console.log('[LUNAR-WRAPPER] Connected to Lunar proxy');
      this.mainWindow.webContents.send('lunar-connected', true);
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'TOOL_PLAN_READY') {
        this.mainWindow.webContents.send('tool-plan-ready', message);
      }
    });

    this.ws.on('error', (err) => {
      console.error('[LUNAR-WRAPPER] Proxy connection error:', err);
      this.mainWindow.webContents.send('lunar-connected', false);
    });

    this.ws.on('close', () => {
      console.log('[LUNAR-WRAPPER] Disconnected from Lunar proxy');
      this.mainWindow.webContents.send('lunar-connected', false);
      // Attempt reconnection after 5 seconds
      setTimeout(() => this.connectToLunarProxy(), 5000);
    });
  }

  setupHandlers() {
    // Handle prompt interception from renderer
    ipcMain.handle('analyze-prompt', async (event, prompt) => {
      if (!this.isLunarEnabled) {
        return { enhanced: false, prompt: prompt };
      }

      try {
        const response = await axios.post(`${this.lunarProxyUrl}/analyze`, {
          prompt: prompt,
          sessionId: this.sessionId
        });

        return {
          enhanced: true,
          enhancedPrompt: response.data.enhancedPrompt,
          toolsIdentified: response.data.toolsIdentified,
          confidence: response.data.confidence,
          sessionId: response.data.sessionId
        };
      } catch (error) {
        console.error('[LUNAR-WRAPPER] Analysis failed:', error);
        return { enhanced: false, prompt: prompt, error: error.message };
      }
    });

    // Get tool plan details
    ipcMain.handle('get-tool-plan', async (event, sessionId) => {
      try {
        const response = await axios.get(`${this.lunarProxyUrl}/plan/${sessionId}`);
        return response.data;
      } catch (error) {
        return { error: error.message };
      }
    });

    // Check proxy health
    ipcMain.handle('check-proxy-health', async () => {
      try {
        const response = await axios.get(`${this.lunarProxyUrl}/health`);
        return response.data;
      } catch (error) {
        return { status: 'offline', error: error.message };
      }
    });
  }

  async checkProxyStatus() {
    try {
      const response = await axios.get(`${this.lunarProxyUrl}/health`);
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Lunar Proxy Status',
        message: 'Proxy is running',
        detail: `Status: ${response.data.status}\nMode: ${response.data.mode}\nPlans ready: ${response.data.plansReady}`
      });
    } catch (error) {
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Lunar Proxy Status',
        message: 'Proxy is not running',
        detail: 'Please start the Lunar proxy server with: npm run proxy'
      });
    }
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Lunar Claude',
      message: 'Lunar Claude Wrapper',
      detail: 'Enhanced Claude Desktop with proactive tool management.\n\nVersion: 1.0.0\nAuthor: Gary O\'Leary'
    });
  }
}

// App event handlers
let wrapper;

app.whenReady().then(() => {
  wrapper = new LunarClaudeWrapper();
  wrapper.createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    wrapper.createWindow();
  }
});
