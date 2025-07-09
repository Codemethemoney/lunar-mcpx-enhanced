// Lunar Claude Interceptor - Content Script
console.log('[LUNAR] Claude interceptor loaded');

// Connect to Lunar Proxy
let ws = null;
let sessionId = Date.now().toString();

function connectToLunarProxy() {
  ws = new WebSocket('ws://localhost:8081');
  
  ws.onopen = () => {
    console.log('[LUNAR] Connected to proxy server');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'TOOL_PLAN_READY') {
      injectEnhancedPrompt(data.enhancedPrompt);
    }
  };
  
  ws.onerror = () => {
    console.log('[LUNAR] Proxy connection failed - falling back to normal Claude');
  };
}

// Intercept user input
function interceptPrompts() {
  // Find Claude's input field (this selector would need updating)
  const observer = new MutationObserver(() => {
    const inputField = document.querySelector('textarea[placeholder*="Message"]');
    
    if (inputField && !inputField.dataset.lunarIntercepted) {
      inputField.dataset.lunarIntercepted = 'true';
      
      // Intercept Enter key
      inputField.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const prompt = inputField.value.trim();
          
          if (prompt && ws && ws.readyState === WebSocket.OPEN) {
            e.preventDefault();
            
            // Send to Lunar for preprocessing
            ws.send(JSON.stringify({
              type: 'PROMPT_INTERCEPTED',
              prompt: prompt,
              sessionId: sessionId
            }));
            
            // Show loading indicator
            showLunarProcessing();
          }
        }
      });
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function injectEnhancedPrompt(enhancedPrompt) {
  const inputField = document.querySelector('textarea[placeholder*="Message"]');
  if (inputField) {
    // Replace with enhanced prompt
    inputField.value = enhancedPrompt;
    
    // Trigger Claude to process
    const event = new Event('input', { bubbles: true });
    inputField.dispatchEvent(event);
    
    // Auto-submit
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

function showLunarProcessing() {
  // Visual indicator that Lunar is processing
  const indicator = document.createElement('div');
  indicator.id = 'lunar-indicator';
  indicator.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; 
                background: #4CAF50; color: white; 
                padding: 10px 20px; border-radius: 5px;
                z-index: 10000; font-family: sans-serif;">
      🌙 Lunar analyzing prompt...
    </div>
  `;
  document.body.appendChild(indicator);
  
  setTimeout(() => indicator.remove(), 3000);
}

// Initialize
connectToLunarProxy();
interceptPrompts();
