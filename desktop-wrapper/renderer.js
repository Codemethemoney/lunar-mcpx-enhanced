// Renderer process - Handles UI and Claude interaction
const { lunarAPI } = window;

class LunarClaudeInterface {
  constructor() {
    this.webview = document.getElementById('claude-webview');
    this.sidebar = document.getElementById('sidebar');
    this.inputOverlay = document.getElementById('input-overlay');
    this.lunarInput = document.getElementById('lunar-input');
    this.toolPlanModal = document.getElementById('tool-plan-modal');
    this.loadingSpinner = document.getElementById('loading-spinner');
    
    this.isLunarEnabled = true;
    this.currentSessionId = null;
    this.recentPlans = [];
    this.toolRegistry = new Map();
    
    this.initializeEventListeners();
    this.setupLunarListeners();
    this.loadToolRegistry();
    
    // Initialize webview when ready
    this.webview.addEventListener('dom-ready', () => {
      this.injectClaudeInterceptor();
    });
  }

  initializeEventListeners() {
    // Toggle sidebar
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
      this.sidebar.classList.toggle('hidden');
    });

    // Input handling
    this.lunarInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await this.sendWithLunar();
      }
    });

    // Button handlers
    document.getElementById('send-enhanced').addEventListener('click', () => this.sendWithLunar());
    document.getElementById('send-normal').addEventListener('click', () => this.sendWithoutLunar());
    document.getElementById('execute-plan').addEventListener('click', () => this.executePlan());
    document.getElementById('modify-plan').addEventListener('click', () => this.modifyPlan());
    document.getElementById('cancel-plan').addEventListener('click', () => this.cancelPlan());

    // Real-time analysis preview
    let analysisTimeout;
    this.lunarInput.addEventListener('input', () => {
      clearTimeout(analysisTimeout);
      analysisTimeout = setTimeout(() => this.previewAnalysis(), 500);
    });
  }

  setupLunarListeners() {
    // Lunar connection status
    lunarAPI.on('lunar-connected', (connected) => {
      const indicator = document.getElementById('lunar-indicator');
      const status = document.getElementById('lunar-status');
      
      if (connected) {
        indicator.className = 'status-indicator connected';
        status.textContent = 'Lunar: Connected';
      } else {
        indicator.className = 'status-indicator disconnected';
        status.textContent = 'Lunar: Disconnected';
      }
    });

    // Lunar enabled/disabled
    lunarAPI.on('lunar-status-changed', (enabled) => {
      this.isLunarEnabled = enabled;
      this.updateUI();
    });

    // Tool plan ready
    lunarAPI.on('tool-plan-ready', (plan) => {
      this.showToolPlan(plan);
    });

    // Show tool registry
    lunarAPI.on('show-tool-registry', () => {
      this.sidebar.classList.remove('hidden');
      this.scrollToToolRegistry();
    });
  }

  injectClaudeInterceptor() {
    // Inject script into Claude webview to intercept prompts
    const interceptorScript = `
      (function() {
        console.log('[LUNAR] Injecting Claude interceptor');
        
        // Override the input handler
        const observer = new MutationObserver(() => {
          const inputField = document.querySelector('textarea[placeholder*="Message"]');
          
          if (inputField && !inputField.dataset.lunarIntercepted) {
            inputField.dataset.lunarIntercepted = 'true';
            
            // Store original event handler
            const originalKeydown = inputField.onkeydown;
            
            inputField.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && !e.shiftKey && window.lunarEnabled) {
                e.preventDefault();
                e.stopPropagation();
                
                // Send to Lunar for processing
                window.postMessage({
                  type: 'LUNAR_INTERCEPT',
                  prompt: inputField.value
                }, '*');
              } else if (originalKeydown) {
                originalKeydown.call(inputField, e);
              }
            });
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Listen for Lunar commands
        window.addEventListener('message', (event) => {
          if (event.data.type === 'LUNAR_INJECT') {
            const inputField = document.querySelector('textarea[placeholder*="Message"]');
            if (inputField) {
              inputField.value = event.data.prompt;
              inputField.dispatchEvent(new Event('input', { bubbles: true }));
              
              // Auto-send
              setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  bubbles: true
                });
                inputField.dispatchEvent(enterEvent);
              }, 100);
            }
          }
        });
        
        window.lunarEnabled = true;
      })();
    `;
    
    this.webview.executeJavaScript(interceptorScript);
    
    // Listen for messages from webview
    this.webview.addEventListener('ipc-message', (event) => {
      if (event.channel === 'lunar-intercept') {
        this.handleInterceptedPrompt(event.args[0]);
      }
    });
  }

  async handleInterceptedPrompt(prompt) {
    this.lunarInput.value = prompt;
    this.inputOverlay.classList.remove('hidden');
    await this.previewAnalysis();
  }

  async previewAnalysis() {
    const prompt = this.lunarInput.value.trim();
    if (!prompt) return;

    const preview = document.getElementById('analysis-preview');
    preview.innerHTML = '<span class="analyzing">Analyzing...</span>';

    try {
      const result = await lunarAPI.analyzePrompt(prompt);
      
      if (result.enhanced) {
        preview.innerHTML = `
          <span class="tools-found">
            🌙 Found ${result.toolsIdentified} tools 
            (${Math.round(result.confidence * 100)}% confidence)
          </span>
        `;
      } else {
        preview.innerHTML = '<span class="no-tools">No specific tools identified</span>';
      }
    } catch (error) {
      preview.innerHTML = '<span class="error">Analysis unavailable</span>';
    }
  }

  async sendWithLunar() {
    const prompt = this.lunarInput.value.trim();
    if (!prompt) return;

    this.showLoading(true);

    try {
      const result = await lunarAPI.analyzePrompt(prompt);
      
      if (result.enhanced) {
        this.currentSessionId = result.sessionId;
        
        // Show tool plan details
        const plan = await lunarAPI.getToolPlan(result.sessionId);
        this.addToRecentPlans(plan);
        
        // Inject enhanced prompt into Claude
        this.webview.send('lunar-inject', {
          type: 'LUNAR_INJECT',
          prompt: result.enhancedPrompt
        });
        
        this.inputOverlay.classList.add('hidden');
        this.lunarInput.value = '';
      } else {
        // No enhancement needed
        this.sendWithoutLunar();
      }
    } catch (error) {
      console.error('[LUNAR] Enhancement failed:', error);
      this.sendWithoutLunar();
    } finally {
      this.showLoading(false);
    }
  }

  sendWithoutLunar() {
    const prompt = this.lunarInput.value.trim();
    if (!prompt) return;

    // Send original prompt to Claude
    this.webview.send('lunar-inject', {
      type: 'LUNAR_INJECT',
      prompt: prompt
    });

    this.inputOverlay.classList.add('hidden');
    this.lunarInput.value = '';
  }

  showToolPlan(plan) {
    const details = document.getElementById('tool-plan-details');
    details.innerHTML = `
      <div class="plan-summary">
        <p><strong>Session:</strong> ${plan.sessionId}</p>
        <p><strong>Tools identified:</strong> ${plan.toolPlan.length}</p>
      </div>
      <div class="plan-steps">
        ${plan.toolPlan.map(step => `
          <div class="plan-step">
            <span class="step-number">${step.step}</span>
            <span class="tool-name">${step.tool}</span>
            <span class="confidence">${Math.round(step.confidence * 100)}%</span>
          </div>
        `).join('')}
      </div>
    `;
    
    this.toolPlanModal.classList.remove('hidden');
  }

  executePlan() {
    // Plan is already injected, just close modal
    this.toolPlanModal.classList.add('hidden');
  }

  modifyPlan() {
    // Allow user to modify the plan
    this.toolPlanModal.classList.add('hidden');
    // TODO: Implement plan modification UI
  }

  cancelPlan() {
    this.toolPlanModal.classList.add('hidden');
    this.currentSessionId = null;
  }

  addToRecentPlans(plan) {
    this.recentPlans.unshift({
      timestamp: new Date(),
      ...plan
    });
    
    // Keep only last 10 plans
    if (this.recentPlans.length > 10) {
      this.recentPlans.pop();
    }
    
    this.updateRecentPlansUI();
  }

  updateRecentPlansUI() {
    const container = document.getElementById('recent-plans');
    
    if (this.recentPlans.length === 0) {
      container.innerHTML = '<p class="placeholder">No recent plans</p>';
      return;
    }
    
    container.innerHTML = this.recentPlans.map(plan => `
      <div class="recent-plan-item">
        <div class="plan-time">${this.formatTime(plan.timestamp)}</div>
        <div class="plan-summary">${plan.toolPlan.length} tools</div>
      </div>
    `).join('');
  }

  async loadToolRegistry() {
    try {
      // This would normally load from Lunar
      const health = await lunarAPI.checkProxyHealth();
      
      if (health.status === 'running') {
        // Load tool registry
        this.updateToolCount(26); // Example count
        this.displayToolRegistry();
      }
    } catch (error) {
      console.error('[LUNAR] Failed to load tool registry:', error);
    }
  }

  displayToolRegistry() {
    const container = document.getElementById('tool-registry');
    container.innerHTML = `
      <div class="tool-categories">
        <div class="tool-category">
          <h5>🐙 GitHub (5 tools)</h5>
          <p>Repository management, issues, PRs</p>
        </div>
        <div class="tool-category">
          <h5>🐳 Docker (4 tools)</h5>
          <p>Container management, compose</p>
        </div>
        <div class="tool-category">
          <h5>📁 Filesystem (6 tools)</h5>
          <p>File operations, searching</p>
        </div>
        <div class="tool-category">
          <h5>🤖 AI/ML (3 tools)</h5>
          <p>Code generation, analysis</p>
        </div>
        <div class="tool-category">
          <h5>🗄️ Database (5 tools)</h5>
          <p>PostgreSQL, Neon operations</p>
        </div>
        <div class="tool-category">
          <h5>🌐 Web (3 tools)</h5>
          <p>Web search, fetching, browsing</p>
        </div>
      </div>
    `;
  }

  updateToolCount(count) {
    document.getElementById('tool-count').textContent = `Tools ready: ${count}`;
  }

  scrollToToolRegistry() {
    document.getElementById('tool-registry').scrollIntoView({ behavior: 'smooth' });
  }

  showLoading(show) {
    if (show) {
      this.loadingSpinner.classList.remove('hidden');
    } else {
      this.loadingSpinner.classList.add('hidden');
    }
  }

  updateUI() {
    if (this.isLunarEnabled) {
      document.getElementById('send-enhanced').disabled = false;
      document.getElementById('send-enhanced').textContent = 'Send with Lunar ✨';
    } else {
      document.getElementById('send-enhanced').disabled = true;
      document.getElementById('send-enhanced').textContent = 'Lunar Disabled';
    }
  }

  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LunarClaudeInterface();
});
