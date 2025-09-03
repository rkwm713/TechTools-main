// TechTools Web - Modern Single Page Application
//
// This file powers the TechTools website with a persistent sidebar navigation
// and modern UI improvements. It provides calculators, notes editor, checklist
// manager and clearance checkers with enhanced UX.

(function () {
  
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    // Enhanced error handling and user feedback
    const UI = {
      showAlert(message, type = 'error', container = null) {
        if (!container) container = document.getElementById('toolContent') || document.body;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Remove existing alerts
        const existingAlerts = container.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Insert at the beginning of the container
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (alertDiv.parentNode) {
            alertDiv.remove();
          }
        }, 5000);
      },
      
      showLoading(button, text = 'Loading...') {
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = `<span class="loading-spinner"></span> ${text}`;
        
        return () => {
          button.disabled = false;
          button.textContent = originalText;
        };
      },
      
      validateInput(input, min = null, max = null) {
        const value = parseFloat(input.value);
        let isValid = !isNaN(value) && value >= 0;
        
        if (min !== null && value < min) isValid = false;
        if (max !== null && value > max) isValid = false;
        
        input.classList.remove('input-error', 'input-success');
        input.classList.add(isValid ? 'input-success' : 'input-error');
        
        return isValid;
      },
      
      copyToClipboard(text, successMessage = 'Copied to clipboard!') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => this.showAlert(successMessage, 'success'))
            .catch(() => this.showAlert('Failed to copy to clipboard', 'error'));
        } else {
          // Fallback for older browsers
          try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showAlert(successMessage, 'success');
          } catch (err) {
            this.showAlert('Failed to copy to clipboard', 'error');
          }
        }
      },
      
      createTooltip(triggerText, content) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        
        const trigger = document.createElement('button');
        trigger.className = 'tooltip-trigger';
        trigger.textContent = triggerText;
        trigger.setAttribute('aria-describedby', `tooltip-${Math.random().toString(36).substr(2, 9)}`);
        
        const tooltipContent = document.createElement('div');
        tooltipContent.className = 'tooltip-content';
        tooltipContent.id = trigger.getAttribute('aria-describedby');
        
        if (typeof content === 'string') {
          tooltipContent.innerHTML = content;
        } else {
          // Handle structured content
          if (content.formats) {
            const formatsDiv = document.createElement('div');
            formatsDiv.className = 'tooltip-formats';
            
            content.formats.forEach(format => {
              const formatDiv = document.createElement('div');
              formatDiv.className = 'tooltip-format';
              formatDiv.innerHTML = `<kbd>${format.example}</kbd> <span>${format.description}</span>`;
              formatsDiv.appendChild(formatDiv);
            });
            
            tooltipContent.appendChild(formatsDiv);
          }
          
          if (content.shortcuts) {
            const shortcutsDiv = document.createElement('div');
            shortcutsDiv.className = 'tooltip-shortcuts';
            
            content.shortcuts.forEach(shortcut => {
              const shortcutDiv = document.createElement('div');
              shortcutDiv.className = 'tooltip-format';
              shortcutDiv.innerHTML = `<kbd>${shortcut.key}</kbd> <span>${shortcut.description}</span>`;
              shortcutsDiv.appendChild(shortcutDiv);
            });
            
            tooltipContent.appendChild(shortcutsDiv);
          }
        }
        
        tooltip.appendChild(trigger);
        tooltip.appendChild(tooltipContent);
        
        // Add mobile support - tap to toggle
        let tooltipTimeout;
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          
          if (window.innerWidth <= 768) {
            // Mobile: toggle tooltip
            tooltip.classList.toggle('active');
            
            // Close other tooltips
            document.querySelectorAll('.tooltip.active').forEach(otherTooltip => {
              if (otherTooltip !== tooltip) {
                otherTooltip.classList.remove('active');
              }
            });
            
            // Auto-close after delay
            if (tooltip.classList.contains('active')) {
              clearTimeout(tooltipTimeout);
              tooltipTimeout = setTimeout(() => {
                tooltip.classList.remove('active');
              }, 4000);
            }
          }
        });
        
        // Close tooltip when clicking outside (mobile)
        document.addEventListener('click', (e) => {
          if (!tooltip.contains(e.target)) {
            tooltip.classList.remove('active');
          }
        });
        
        return tooltip;
      }
    };
    
    // Enhanced local storage with error handling
    const Storage = {
      save(key, data) {
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
          UI.showAlert('Failed to save data', 'error');
          return false;
        }
      },
      
      load(key, defaultValue = null) {
        try {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
          console.error('Failed to load from localStorage:', error);
          return defaultValue;
        }
      },
      
      remove(key) {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (error) {
          console.error('Failed to remove from localStorage:', error);
          return false;
        }
      }
    };
    
    // Smart Input System for Measurements
    const SmartInput = {
      // Parse various measurement input formats
      parseInput(value) {
        if (!value || typeof value !== 'string') {
          return { isValid: false, feet: 0, inches: 0, totalInches: 0, error: 'Empty input' };
        }
        
        const input = value.trim().toLowerCase();
        let feet = 0, inches = 0;
        
        try {
          // Format: 25-11 (preferred, fastest)
          if (input.match(/^\d+-\d+$/)) {
            const parts = input.split('-');
            feet = parseInt(parts[0], 10);
            inches = parseInt(parts[1], 10);
          }
          // Format: 25'11" (traditional)
          else if (input.match(/^\d+'?\d*"?$/)) {
            const match = input.match(/^(\d+)'?(\d*)"?$/);
            if (match) {
              feet = parseInt(match[1], 10);
              inches = match[2] ? parseInt(match[2], 10) : 0;
            }
          }
          // Format: 25 11 (space separated)
          else if (input.match(/^\d+\s+\d+$/)) {
            const parts = input.split(/\s+/);
            feet = parseInt(parts[0], 10);
            inches = parseInt(parts[1], 10);
          }
          // Format: 25 (feet only)
          else if (input.match(/^\d+$/)) {
            feet = parseInt(input, 10);
            inches = 0;
          }
          // Format: 0-11 or -11 (inches only)
          else if (input.match(/^0?-\d+$/) || input.match(/^-\d+$/)) {
            feet = 0;
            inches = parseInt(input.replace(/^0?-/, ''), 10);
          }
          // Format: 11" (inches with quote)
          else if (input.match(/^\d+"$/)) {
            feet = 0;
            inches = parseInt(input.replace('"', ''), 10);
          }
          else {
            return { isValid: false, feet: 0, inches: 0, totalInches: 0, error: 'Invalid format' };
          }
          
          // Validate parsed values
          if (isNaN(feet) || isNaN(inches) || feet < 0 || inches < 0) {
            return { isValid: false, feet: 0, inches: 0, totalInches: 0, error: 'Invalid numbers' };
          }
          
          if (inches >= 12) {
            return { isValid: false, feet, inches, totalInches: 0, error: 'Inches must be less than 12' };
          }
          
          const totalInches = feet * 12 + inches;
          return { 
            isValid: true, 
            feet, 
            inches, 
            totalInches, 
            formatted: `${feet}'-${inches}"`,
            error: null 
          };
          
        } catch (error) {
          return { isValid: false, feet: 0, inches: 0, totalInches: 0, error: 'Parse error' };
        }
      },
      
      // Format input to standard format
      formatStandard(feet, inches) {
        return `${feet || 0}-${inches || 0}`;
      },
      
      // Create smart input element with real-time validation
      createSmartInput(placeholder = '0-0', label = '') {
        const wrapper = document.createElement('div');
        wrapper.className = 'smart-input-wrapper';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.className = 'smart-input';
        input.setAttribute('data-label', label);
        
        const feedback = document.createElement('div');
        feedback.className = 'input-feedback';
        
        wrapper.appendChild(input);
        wrapper.appendChild(feedback);
        
        // Add real-time validation
        this.addValidation(input, feedback);
        
        return { wrapper, input, feedback };
      },
      
      // Add validation to existing input
      addValidation(input, feedback) {
        let validationTimeout;
        
        const validateInput = () => {
          clearTimeout(validationTimeout);
          validationTimeout = setTimeout(() => {
            const result = this.parseInput(input.value);
            
            // Update input classes
            input.classList.remove('input-valid', 'input-invalid', 'input-empty');
            
            if (!input.value.trim()) {
              input.classList.add('input-empty');
              feedback.innerHTML = '<span class="hint">Try: 25-11, 25\'11", 25 11, or 25</span>';
              feedback.className = 'input-feedback hint';
            } else if (result.isValid) {
              input.classList.add('input-valid');
              feedback.innerHTML = `
                <span class="checkmark">✓</span>
                <span class="interpretation">${result.formatted} (${result.totalInches} total inches)</span>
              `;
              feedback.className = 'input-feedback valid';
            } else {
              input.classList.add('input-invalid');
              feedback.innerHTML = `<span class="error">✗ ${result.error}</span>`;
              feedback.className = 'input-feedback invalid';
            }
          }, 200); // Debounce validation
        };
        
        // Auto-format on blur
        const autoFormat = () => {
          const result = this.parseInput(input.value);
          if (result.isValid) {
            input.value = this.formatStandard(result.feet, result.inches);
          }
        };
        
        // Add event listeners
        input.addEventListener('input', validateInput);
        input.addEventListener('blur', autoFormat);
        input.addEventListener('focus', () => {
          if (feedback.classList.contains('hint')) {
            feedback.style.display = 'block';
          }
        });
        
        // Keyboard shortcuts
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            input.value = '';
            validateInput();
            e.preventDefault();
          }
        });
        
        // Initial validation
        validateInput();
      },
      
      // Get parsed value from smart input
      getValue(input) {
        return this.parseInput(input.value);
      }
    };
    
    // Legacy validation helpers (updated to use SmartInput)
    const Validation = {
      parseNumber(value, defaultValue = 0) {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
      },
      
      validateFeetInches(ft, inches) {
        const f = this.parseNumber(ft);
        const i = this.parseNumber(inches);
        
        if (f < 0 || i < 0 || i >= 12) {
          return { isValid: false, feet: f, inches: i };
        }
        
        return { isValid: true, feet: f, inches: i };
      },
      
      sanitizeInputs(inputs) {
        return inputs.map(input => this.parseNumber(input.value));
      }
    };
    
    // ==========================================
    // MAIN APPLICATION
    // ==========================================
    
    // Get DOM elements
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const toolContent = document.getElementById('toolContent');
    const toolTitle = document.getElementById('toolTitle');
    const toolActions = document.getElementById('toolActions');
    const searchInput = document.getElementById('searchInput');
    const recentToolsList = document.getElementById('recentToolsList');
    
    // Application state
    let currentTool = null;
    let recentTools = Storage.load('recentTools', []);
    let sidebarOpen = false;

    // Define the available tools with enhanced metadata
    const tools = {
      'fi-calculator': {
        id: 'fi-calculator',
        name: 'Feet & Inches',
        icon: 'icons/fi.png',
        category: 'Calculators',
        shortcut: '1',
        build: buildFiCalculator
      },
      'sag-calculator': {
        id: 'sag-calculator',
        name: 'Sag Calculator',
        icon: 'icons/sag.png',
        category: 'Calculators',
        shortcut: '2',
        build: buildSagCalculator
      },
      'clearance-tools': {
        id: 'clearance-tools',
        name: 'Clearance Tools',
        icon: 'icons/gndcom.png',
        category: 'Clearances',
        shortcut: '3',
        build: buildClearanceTools
      },
      'quic-note': {
        id: 'quic-note',
        name: 'QuiC Note',
        icon: 'icons/note.png',
        category: 'Productivity',
        shortcut: '4',
        build: buildNotePad
      },
      'qc-checklist': {
        id: 'qc-checklist',
        name: 'Design/QC',
        icon: 'icons/checklist.png',
        category: 'Productivity',
        shortcut: '5',
        build: buildChecklistTool
      }
    };

    // ==========================================
    // NAVIGATION & UI MANAGEMENT
    // ==========================================
    
    function initializeNavigation() {
      // Add click listeners to tool navigation items
      document.querySelectorAll('.tool-nav-item').forEach(item => {
        item.addEventListener('click', () => {
          const toolId = item.dataset.tool;
          if (toolId && tools[toolId]) {
            openTool(toolId);
          }
        });
      });
      
      // Initialize hamburger menu for mobile
      if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleSidebar);
      if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
      
      // Initialize search functionality
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          filterTools(e.target.value);
        }, 300);
      });
      
      // Initialize keyboard shortcuts
      document.addEventListener('keydown', handleKeyboardShortcuts);
      
      // Initialize recent tools
      updateRecentToolsList();
    }

    function openTool(toolId) {
      const tool = tools[toolId];
      if (!tool) return;
      
      // Update navigation state
      document.querySelectorAll('.tool-nav-item').forEach(item => {
        item.classList.remove('active');
      });
      
      const activeNavItem = document.querySelector(`[data-tool="${toolId}"]`);
      if (activeNavItem) {
        activeNavItem.classList.add('active');
      }
      
      // Update current tool
      currentTool = toolId;
      
      // Update recent tools
      addToRecentTools(tool);
      
      // Update tool header
      toolTitle.textContent = tool.name;
      toolActions.innerHTML = ''; // Clear previous actions
      
      // Clear and rebuild tool content
      toolContent.innerHTML = '';
      
      // Build the tool
      tool.build();
      
      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
      
      // Scroll to top
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }

    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      sidebar.classList.toggle('open', sidebarOpen);
      sidebarOverlay.classList.toggle('show', sidebarOpen);
      hamburgerBtn.classList.toggle('active', sidebarOpen);
    }
    
    function closeSidebar() {
      sidebarOpen = false;
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('show');
      hamburgerBtn.classList.remove('active');
    }
    
    function filterTools(searchTerm) {
      if (!searchTerm.trim()) {
        // Show all tools
        document.querySelectorAll('.tool-nav-item').forEach(item => {
          item.style.display = 'flex';
        });
        return;
      }
      
      const term = searchTerm.toLowerCase();
      document.querySelectorAll('.tool-nav-item').forEach(item => {
        const toolId = item.dataset.tool;
        const tool = tools[toolId];
        const matches = tool && tool.name.toLowerCase().includes(term);
        item.style.display = matches ? 'flex' : 'none';
      });
    }
    
    function handleKeyboardShortcuts(e) {
      // Don't intercept if user is typing in an input
      if (e.target.matches('input, textarea, [contenteditable]')) {
        return;
      }
      
      // Ctrl+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        return;
      }
      
      // Number keys 1-5 for direct tool access
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          const toolIds = Object.keys(tools);
          if (toolIds[num - 1]) {
            openTool(toolIds[num - 1]);
          }
        }
      }
    }
    
    function addToRecentTools(tool) {
      // Remove if already exists
      recentTools = recentTools.filter(t => t.id !== tool.id);
      
      // Add to front
      recentTools.unshift({
        id: tool.id,
        name: tool.name,
        icon: tool.icon,
        timestamp: Date.now()
      });
      
      // Keep only last 3
      if (recentTools.length > 3) {
        recentTools = recentTools.slice(0, 3);
      }
      
      // Save and update UI
      Storage.save('recentTools', recentTools);
      updateRecentToolsList();
    }
    
    function updateRecentToolsList() {
      if (!recentToolsList) return;
      
      recentToolsList.innerHTML = '';
      
      if (recentTools.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'recent-tool-item';
        emptyMsg.style.fontStyle = 'italic';
        emptyMsg.style.color = '#999';
        emptyMsg.style.cursor = 'default';
        emptyMsg.textContent = 'No recent tools';
        recentToolsList.appendChild(emptyMsg);
        return;
      }
      
      recentTools.forEach(tool => {
        const button = document.createElement('button');
        button.className = 'recent-tool-item';
        button.innerHTML = `
          <img src="${tool.icon}" alt="${tool.name} icon" class="tool-icon" />
          <span>${tool.name}</span>
        `;
        button.addEventListener('click', () => openTool(tool.id));
        recentToolsList.appendChild(button);
      });
    }
    
    // Initialize the application
    initializeNavigation();
  
    function toTotalInches(ft, inches) {
      const f = Number.isFinite(ft) ? ft : 0;
      const i = Number.isFinite(inches) ? inches : 0;
      return f * 12 + i;
    }
    
    function fromTotalInches(total) {
      const sign = total < 0 ? -1 : 1;
      const abs = Math.abs(total);
      const ft = Math.floor(abs / 12);
      const inches = abs % 12;
      return { ft: ft * sign, in: inches };
    }
  
    // ==========================================
    // TOOL BUILDERS
    // ==========================================
  
        // Feet & Inches Calculator - Enhanced with Smart Inputs
    function buildFiCalculator() {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="tool-section">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <h3 style="margin: 0;">Smart Measurements</h3>
            <div id="fi-tooltip-wrapper"></div>
          </div>
          <div class="measurement-grid two-column">
            <div class="measurement-group">
              <label>High Measurement</label>
              <div id="fi-high-wrapper"></div>
            </div>
            <div class="measurement-group">
              <label>Low Measurement</label>
              <div id="fi-low-wrapper"></div>
            </div>
          </div>
          
          <label for="fi-operation">Operation</label>
          <select id="fi-operation">
            <option value="subtract">Subtract (High - Low)</option>
            <option value="add">Add (High + Low)</option>
          </select>
        </div>
        <div class="tool-section">
          <button id="fi-calc-btn" class="btn">Calculate</button>
          <button id="fi-clear-btn" class="btn secondary">Clear History</button>
          <button id="fi-copy-result" class="btn secondary" disabled>Copy Last Result</button>
        </div>
        <div class="tool-section">
          <h3>History</h3>
          <ul id="fi-results" class="results-list"></ul>
        </div>
      `;
      toolContent.appendChild(container);
      
      // Add tooltip for input formats
      const tooltipWrapper = container.querySelector('#fi-tooltip-wrapper');
      const inputTooltip = UI.createTooltip('Input Help', {
        formats: [
          { example: '25-11', description: 'Fastest format' },
          { example: '25\'11"', description: 'Traditional' },
          { example: '25 11', description: 'Space separated' },
          { example: '25', description: 'Feet only' }
        ],
        shortcuts: [
          { key: 'Enter', description: 'Calculate' },
          { key: 'Esc', description: 'Clear' },
          { key: 'Ctrl+C', description: 'Copy result' }
        ]
      });
      tooltipWrapper.appendChild(inputTooltip);
      
      // Create smart inputs
      const highInput = SmartInput.createSmartInput('25-11', 'High measurement');
      const lowInput = SmartInput.createSmartInput('25-11', 'Low measurement');
      
      container.querySelector('#fi-high-wrapper').appendChild(highInput.wrapper);
      container.querySelector('#fi-low-wrapper').appendChild(lowInput.wrapper);
      
      const opSelect = container.querySelector('#fi-operation');
      const resultsList = container.querySelector('#fi-results');
      const calcBtn = container.querySelector('#fi-calc-btn');
      const clearBtn = container.querySelector('#fi-clear-btn');
      const copyResultBtn = container.querySelector('#fi-copy-result');
      const historyKey = 'fiHistory';
      
      let history = Storage.load(historyKey, []);
      let lastResult = null;
      
      // Enhanced keyboard shortcuts
      const inputs = [highInput.input, lowInput.input];
      inputs.forEach((input, idx) => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (idx < inputs.length - 1) {
              inputs[idx + 1].focus();
            } else {
              compute();
            }
          }
        });
      });
      
      // Global keyboard shortcuts for this tool
      const handleToolShortcuts = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && lastResult) {
          e.preventDefault();
          copyLastResult();
        }
      };
      
      document.addEventListener('keydown', handleToolShortcuts);
      
      function updateHistoryList() {
        resultsList.innerHTML = '';
        if (history.length === 0) {
          const emptyMsg = document.createElement('li');
          emptyMsg.textContent = 'No calculations yet. Enter measurements and click Calculate.';
          emptyMsg.style.fontStyle = 'italic';
          emptyMsg.style.color = '#666';
          resultsList.appendChild(emptyMsg);
          return;
        }
        
        history.forEach((entry, idx) => {
          const li = document.createElement('li');
          li.innerHTML = `
            <div>
              <strong>${entry.display}</strong>
              <small style="color: #666; display: block;">${entry.totalInches} total inches</small>
            </div>
            <div style="font-size: 0.8em; color: #999;">${entry.operation}</div>
          `;
          li.title = 'Click to copy formatted value';
          li.addEventListener('click', () => {
            UI.copyToClipboard(entry.display);
          });
          resultsList.appendChild(li);
        });
      }
      
      function compute() {
        const hideLoading = UI.showLoading(calcBtn, 'Calculating...');
        
        try {
          // Get smart input values
          const highResult = SmartInput.getValue(highInput.input);
          const lowResult = SmartInput.getValue(lowInput.input);
          
          // Validate inputs
          if (!highResult.isValid) {
            UI.showAlert(`High measurement error: ${highResult.error}`, 'error');
            highInput.input.focus();
            hideLoading();
            return;
          }
          
          if (!lowResult.isValid) {
            UI.showAlert(`Low measurement error: ${lowResult.error}`, 'error');
            lowInput.input.focus();
            hideLoading();
            return;
          }
          
          // Perform calculation
          const resultTotal = opSelect.value === 'subtract' 
            ? highResult.totalInches - lowResult.totalInches 
            : highResult.totalInches + lowResult.totalInches;
          
        const { ft: rft, in: rin } = fromTotalInches(resultTotal);
          const display = `${rft}'-${rin}"`;
          
          const operationText = opSelect.value === 'subtract' 
            ? `${highResult.formatted} - ${lowResult.formatted} = ${display}`
            : `${highResult.formatted} + ${lowResult.formatted} = ${display}`;
          
          const entry = { 
            display, 
            totalInches: resultTotal, 
            operation: operationText,
            timestamp: new Date().toLocaleTimeString()
          };
          
          lastResult = entry;
          copyResultBtn.disabled = false;
          
          history.unshift(entry); // Add to beginning
          if (history.length > 10) history.pop(); // Keep more history
          
          Storage.save(historyKey, history);
        updateHistoryList();
          
          // Show copy animation
          showCopyAnimation(`Result: ${display}`);
          
        } catch (error) {
          console.error('Calculation error:', error);
          UI.showAlert('An error occurred during calculation', 'error');
        } finally {
          hideLoading();
        }
      }
      
      function copyLastResult() {
        if (lastResult) {
          UI.copyToClipboard(lastResult.display, 'Last result copied!');
        }
      }
      
      function showCopyAnimation(message) {
        const popup = document.createElement('div');
        popup.className = 'copy-success';
        popup.textContent = message;
        document.body.appendChild(popup);
        
        setTimeout(() => {
          if (popup.parentNode) {
            popup.remove();
          }
        }, 2000);
      }
      
      calcBtn.addEventListener('click', compute);
      
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all calculation history?')) {
        history = [];
          Storage.save(historyKey, history);
        updateHistoryList();
          UI.showAlert('History cleared', 'success');
        }
      });
      
      copyResultBtn.addEventListener('click', copyLastResult);
      
      // Cleanup function to remove event listeners
      const cleanup = () => {
        document.removeEventListener('keydown', handleToolShortcuts);
      };
      
      // Store cleanup function for later use if needed
      window.fiCalculatorCleanup = cleanup;
      
      updateHistoryList();
      
      // Focus first input
      highInput.input.focus();
    }
  
    // Note editor - Enhanced version
    function buildNotePad() {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="tool-section">
        <div class="note-toolbar">
            <button data-command="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
            <button data-command="italic" title="Italic (Ctrl+I)"><em>I</em></button>
            <button data-command="underline" title="Underline (Ctrl+U)"><u>U</u></button>
          <button data-command="insertUnorderedList" title="Bulleted list">• List</button>
          <button data-command="insertOrderedList" title="Numbered list">1. List</button>
            <span style="border-left: 1px solid var(--color-border); margin: 0 0.5rem;"></span>
            <button id="note-copy-text" title="Copy as plain text">Copy Text</button>
            <button id="note-copy-html" title="Copy as formatted HTML">Copy HTML</button>
            <button id="note-clear" class="btn secondary" title="Clear note">Clear</button>
        </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0; font-size: 0.8rem; color: #666;">
            <span id="note-status">Ready</span>
            <span id="note-char-count">0 characters</span>
          </div>
          <div id="note-editor" class="note-editor" contenteditable="true" placeholder="Start typing your note..."></div>
        </div>
      `;
      toolContent.appendChild(container);
      
      const editor = container.querySelector('#note-editor');
      const copyTextBtn = container.querySelector('#note-copy-text');
      const copyHtmlBtn = container.querySelector('#note-copy-html');
      const clearBtn = container.querySelector('#note-clear');
      const statusSpan = container.querySelector('#note-status');
      const charCountSpan = container.querySelector('#note-char-count');
      const buttons = container.querySelectorAll('.note-toolbar button[data-command]');
      
      // Load saved content
      const saved = Storage.load('quicNote', '');
      if (saved) {
        editor.innerHTML = saved;
      }
      
      // Add placeholder handling
      function updatePlaceholder() {
        if (editor.innerHTML.trim() === '' || editor.innerHTML === '<br>') {
          editor.classList.add('empty');
        } else {
          editor.classList.remove('empty');
        }
      }
      
      // Add character count and status updates
      function updateStatus() {
        const textContent = editor.innerText || editor.textContent;
        charCountSpan.textContent = `${textContent.length} characters`;
        updatePlaceholder();
      }
      
      // Auto-save functionality
      let saveTimeout;
      function autoSave() {
        clearTimeout(saveTimeout);
        statusSpan.textContent = 'Saving...';
        
        saveTimeout = setTimeout(() => {
          if (Storage.save('quicNote', editor.innerHTML)) {
            statusSpan.textContent = 'Saved';
            setTimeout(() => {
              statusSpan.textContent = 'Ready';
            }, 2000);
          } else {
            statusSpan.textContent = 'Save failed';
          }
        }, 500); // Debounce saves
      }
      
      // Formatting buttons
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const cmd = btn.dataset.command;
          
          try {
          document.execCommand(cmd, false, null);
          editor.focus();
            autoSave();
            UI.showAlert(`Applied ${cmd} formatting`, 'success');
          } catch (error) {
            console.error('Formatting error:', error);
            UI.showAlert('Failed to apply formatting', 'error');
          }
        });
      });
      
      // Copy functionality
      copyTextBtn.addEventListener('click', () => {
        const plainText = editor.innerText || editor.textContent;
        if (plainText.trim()) {
          UI.copyToClipboard(plainText, 'Plain text copied to clipboard!');
        } else {
          UI.showAlert('Note is empty', 'warning');
        }
      });
      
      copyHtmlBtn.addEventListener('click', () => {
        const htmlContent = editor.innerHTML;
        if (htmlContent.trim()) {
          UI.copyToClipboard(htmlContent, 'HTML copied to clipboard!');
        } else {
          UI.showAlert('Note is empty', 'warning');
        }
      });
      
      // Clear functionality
      clearBtn.addEventListener('click', () => {
        if (editor.innerHTML.trim() && confirm('Are you sure you want to clear the note?')) {
          editor.innerHTML = '';
          Storage.save('quicNote', '');
          updateStatus();
          UI.showAlert('Note cleared', 'success');
        }
      });
      
      // Editor event listeners
      editor.addEventListener('input', () => {
        updateStatus();
        autoSave();
      });
      
      editor.addEventListener('paste', (e) => {
        // Allow paste but trigger auto-save
        setTimeout(() => {
          updateStatus();
          autoSave();
        }, 10);
      });
      
      editor.addEventListener('focus', () => {
        statusSpan.textContent = 'Editing...';
      });
      
      editor.addEventListener('blur', () => {
        statusSpan.textContent = 'Ready';
      });
      
      // Keyboard shortcuts
      editor.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'b':
              e.preventDefault();
              document.execCommand('bold', false, null);
              autoSave();
              break;
            case 'i':
              e.preventDefault();
              document.execCommand('italic', false, null);
              autoSave();
              break;
            case 'u':
              e.preventDefault();
              document.execCommand('underline', false, null);
              autoSave();
              break;
          }
        }
      });
      
      // Initial status update
      updateStatus();
      editor.focus();
    }
  
        // Sag calculator - Enhanced with Smart Inputs
    function buildSagCalculator() {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="tool-section">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <h3 style="margin: 0;">Neutral Measurements</h3>
            <div id="sag-tooltip-wrapper"></div>
          </div>
          <div class="measurement-grid four-column">
            <div class="measurement-group">
              <label>Neutral 1</label>
              <div id="sag-n1-wrapper"></div>
            </div>
            <div class="measurement-group">
              <label>Neutral 2</label>
              <div id="sag-n2-wrapper"></div>
            </div>
            <div class="measurement-group">
              <label>Neutral Midspan</label>
              <div id="sag-nmid-wrapper"></div>
            </div>
            <div class="measurement-group">
              <label><!-- spacer --></label>
              <div></div>
            </div>
          </div>
          
          <h3>Proposed Fiber Measurements</h3>
          <div class="measurement-grid four-column">
            <div class="measurement-group">
              <label>Fiber 1</label>
              <div id="sag-f1-wrapper"></div>
            </div>
            <div class="measurement-group">
              <label>Fiber 2</label>
              <div id="sag-f2-wrapper"></div>
            </div>
            <div class="measurement-group">
              <label><!-- spacer --></label>
              <div></div>
            </div>
            <div class="measurement-group">
              <label><!-- spacer --></label>
              <div></div>
            </div>
          </div>
          
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="sag-calc" class="btn">Calculate Sag</button>
            <button id="sag-clear" class="btn secondary">Clear All</button>
            <button id="sag-copy" class="btn secondary" disabled>Copy Results</button>
          </div>
        </div>
        
        <div class="tool-section" id="sag-results" style="display:none;">
          <h3>Calculation Results</h3>
          <div style="background: #f8f9fa; padding: 1rem; border-radius: var(--radius); margin: 0.5rem 0;">
            <div id="sag-summary" style="font-size: 1.1rem; margin-bottom: 0.5rem;"></div>
            <div id="sag-details" style="font-size: 0.9rem; color: #666;"></div>
          </div>
          <div id="sag-factor" style="font-weight: bold; color: var(--color-primary);"></div>
          <div id="sag-fiber" style="font-weight: bold; color: var(--color-success); font-size: 1.2rem;"></div>
        </div>
      `;
      toolContent.appendChild(container);
      
      // Add tooltip for input formats
      const tooltipWrapper = container.querySelector('#sag-tooltip-wrapper');
      const sagTooltip = UI.createTooltip('Input Help', {
        formats: [
          { example: '25-11', description: 'Fastest format' },
          { example: '25\'11"', description: 'Traditional' },
          { example: '25 11', description: 'Space separated' },
          { example: '25', description: 'Feet only' }
        ],
        shortcuts: [
          { key: 'Enter', description: 'Next field' },
          { key: 'Tab', description: 'Calculate' },
          { key: 'Esc', description: 'Clear all' }
        ]
      });
      tooltipWrapper.appendChild(sagTooltip);
      
      // Create smart inputs
      const smartInputs = {
        n1: SmartInput.createSmartInput('25-11', 'Neutral 1'),
        n2: SmartInput.createSmartInput('25-11', 'Neutral 2'), 
        nmid: SmartInput.createSmartInput('25-11', 'Neutral Midspan'),
        f1: SmartInput.createSmartInput('25-11', 'Fiber 1'),
        f2: SmartInput.createSmartInput('25-11', 'Fiber 2')
      };
      
      // Append smart inputs to their wrappers
      container.querySelector('#sag-n1-wrapper').appendChild(smartInputs.n1.wrapper);
      container.querySelector('#sag-n2-wrapper').appendChild(smartInputs.n2.wrapper);
      container.querySelector('#sag-nmid-wrapper').appendChild(smartInputs.nmid.wrapper);
      container.querySelector('#sag-f1-wrapper').appendChild(smartInputs.f1.wrapper);
      container.querySelector('#sag-f2-wrapper').appendChild(smartInputs.f2.wrapper);
      
      const resultsSection = container.querySelector('#sag-results');
      const summaryEl = container.querySelector('#sag-summary');
      const detailsEl = container.querySelector('#sag-details');
      const factorEl = container.querySelector('#sag-factor');
      const fiberEl = container.querySelector('#sag-fiber');
      const calcBtn = container.querySelector('#sag-calc');
      const clearBtn = container.querySelector('#sag-clear');
      const copyBtn = container.querySelector('#sag-copy');
      
      let lastResults = null;
      
      // Add keyboard navigation for smart inputs
      const inputOrder = [smartInputs.n1.input, smartInputs.n2.input, smartInputs.nmid.input, smartInputs.f1.input, smartInputs.f2.input];
      inputOrder.forEach((input, idx) => {
        input.addEventListener('input', () => {
          copyBtn.disabled = true; // Disable copy until new calculation
        });
        
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (idx < inputOrder.length - 1) {
              inputOrder[idx + 1].focus();
            } else {
              calculate();
            }
          }
          if (e.key === 'Escape') {
            clearAll();
            e.preventDefault();
          }
        });
      });
      
      function calculate() {
        const hideLoading = UI.showLoading(calcBtn, 'Calculating...');
        
        try {
          // Get smart input values
          const values = {
            n1: SmartInput.getValue(smartInputs.n1.input),
            n2: SmartInput.getValue(smartInputs.n2.input),
            nmid: SmartInput.getValue(smartInputs.nmid.input),
            f1: SmartInput.getValue(smartInputs.f1.input),
            f2: SmartInput.getValue(smartInputs.f2.input)
          };
          
          // Validate all inputs
          for (const [key, result] of Object.entries(values)) {
            if (!result.isValid) {
              UI.showAlert(`${key.toUpperCase()} measurement error: ${result.error}`, 'error');
              smartInputs[key].input.focus();
              hideLoading();
          return;
            }
        }
          
          // Validate critical measurements
          if (values.nmid.totalInches <= 0) {
            UI.showAlert('Neutral midspan must be greater than zero', 'error');
            smartInputs.nmid.input.focus();
            hideLoading();
            return;
          }
          
          // Validate that fiber measurements are provided
          if (values.f1.totalInches <= 0 || values.f2.totalInches <= 0) {
            UI.showAlert('Both fiber measurements must be greater than zero', 'error');
            values.f1.totalInches <= 0 ? smartInputs.f1.input.focus() : smartInputs.f2.input.focus();
            hideLoading();
            return;
          }
          
          // Perform calculations using totalInches directly
          const n1Dec = values.n1.totalInches / 12;
          const n2Dec = values.n2.totalInches / 12;
          const nmidDec = values.nmid.totalInches / 12;
          const f1Dec = values.f1.totalInches / 12;
          const f2Dec = values.f2.totalInches / 12;
          
        const neutralAvg = (n1Dec + n2Dec) / 2;
        const sagFactor = neutralAvg / nmidDec;
        const fiberAvg = (f1Dec + f2Dec) / 2;
        const fiberSag = fiberAvg / sagFactor;
          
          // Handle the special case for 12 inches using original algorithm
        const sagFt = Math.floor(fiberSag);
        const sagIn = (fiberSag - sagFt) * 12;
        const sagInRounded = Math.round(sagIn);
        let finalFt = sagFt;
        let finalIn = sagInRounded;
        if (sagInRounded === 12) {
          finalFt += 1;
          finalIn = 0;
        }
          
          // Store results for copying
          lastResults = {
            sagFactor: sagFactor,
            fiberSag: `${finalFt}'-${finalIn}"`,
            neutralAvg: neutralAvg,
            fiberAvg: fiberAvg,
            calculations: {
              n1: values.n1.formatted,
              n2: values.n2.formatted,
              nmid: values.nmid.formatted,
              f1: values.f1.formatted,
              f2: values.f2.formatted
            }
          };
          
          // Display results
          summaryEl.innerHTML = `
            <strong>Fiber Midspan Sag: ${lastResults.fiberSag}</strong>
          `;
          
          detailsEl.innerHTML = `
            Neutral Average: ${neutralAvg.toFixed(3)} ft | 
            Fiber Average: ${fiberAvg.toFixed(3)} ft | 
            Sag Factor: ${sagFactor.toFixed(4)}
          `;
          
        factorEl.textContent = `Sag Factor: ${sagFactor.toFixed(3)}`;
          fiberEl.innerHTML = `<strong>Result: ${lastResults.fiberSag}</strong>`;
          
          resultsSection.style.display = 'block';
          copyBtn.disabled = false;
          
          UI.showAlert(`Calculation complete! Fiber sag: ${lastResults.fiberSag}`, 'success');
          
        } catch (error) {
          console.error('Sag calculation error:', error);
          UI.showAlert('An error occurred during sag calculation', 'error');
        } finally {
          hideLoading();
        }
      }
      
      function clearAll() {
        if (confirm('Are you sure you want to clear all inputs?')) {
          // Clear smart inputs
          Object.values(smartInputs).forEach(smartInput => {
            smartInput.input.value = '';
            smartInput.input.classList.remove('input-valid', 'input-invalid', 'input-empty');
            smartInput.input.classList.add('input-empty');
            // Trigger validation to reset feedback
            smartInput.input.dispatchEvent(new Event('input'));
          });
          resultsSection.style.display = 'none';
          copyBtn.disabled = true;
          lastResults = null;
          UI.showAlert('All inputs cleared', 'success');
          smartInputs.n1.input.focus();
        }
      }
      
      function copyResults() {
        if (!lastResults) return;
        
        const resultText = `Sag Calculation Results:
  Neutral 1: ${lastResults.calculations.n1}
  Neutral 2: ${lastResults.calculations.n2}  
  Neutral Midspan: ${lastResults.calculations.nmid}
  Fiber 1: ${lastResults.calculations.f1}
  Fiber 2: ${lastResults.calculations.f2}
  
  Sag Factor: ${lastResults.sagFactor.toFixed(3)}
  Fiber Midspan Sag: ${lastResults.fiberSag}`;
        
        UI.copyToClipboard(resultText, 'Sag calculation results copied!');
      }
      
      calcBtn.addEventListener('click', calculate);
      clearBtn.addEventListener('click', clearAll);
      copyBtn.addEventListener('click', copyResults);
      
      // Focus first input on load
      smartInputs.n1.input.focus();
    }
  
    // ==========================================
    // CLEARANCE TOOLS WITH TABS
    // ==========================================
    
    function buildClearanceTools() {
      const container = document.createElement('div');
            container.innerHTML = `
        <div class="clearance-tabs" style="display: flex; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem;">
          <button class="tab-btn active" data-tab="gnd2com" style="flex: 1; padding: 1rem; border: none; background: none; border-bottom: 2px solid var(--color-primary); color: var(--color-primary); font-weight: bold; cursor: pointer; transition: all var(--transition-fast);">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <img src="icons/gndcom.png" alt="GND2COM" style="width: 20px; height: 20px;" />
                <strong>GND2COM</strong>
              </div>
              <div style="font-size: 0.7rem; font-weight: normal; opacity: 0.8;">Ground to Communication</div>
            </div>
          </button>
          <button class="tab-btn" data-tab="gnd2pwr" style="flex: 1; padding: 1rem; border: none; background: none; border-bottom: 2px solid transparent; color: #666; cursor: pointer; transition: all var(--transition-fast);">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <img src="icons/gndpwr.png" alt="GND2PWR" style="width: 20px; height: 20px;" />
                <strong>GND2PWR</strong>
              </div>
              <div style="font-size: 0.7rem; font-weight: normal; opacity: 0.8;">Ground to Power</div>
            </div>
          </button>
          <button class="tab-btn" data-tab="bolt" style="flex: 1; padding: 1rem; border: none; background: none; border-bottom: 2px solid transparent; color: #666; cursor: pointer; transition: all var(--transition-fast);">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <img src="icons/bolt.png" alt="Pole Clearances" style="width: 20px; height: 20px;" />
                <strong>Pole Clearances</strong>
              </div>
              <div style="font-size: 0.7rem; font-weight: normal; opacity: 0.8;">CWSZ & Separations</div>
            </div>
          </button>
        </div>
        <div class="tab-content" id="clearanceTabContent"></div>
      `;
      
      toolContent.appendChild(container);
      
      // Add tab functionality
      const tabBtns = container.querySelectorAll('.tab-btn');
      const tabContent = container.querySelector('#clearanceTabContent');
      
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.dataset.tab;
          
          // Update active tab
          tabBtns.forEach(b => {
            b.style.borderBottomColor = 'transparent';
            b.style.color = '#666';
          });
          btn.style.borderBottomColor = 'var(--color-primary)';
          btn.style.color = 'var(--color-primary)';
          btn.style.fontWeight = 'bold';
          
          // Update content
          tabContent.innerHTML = '';
          if (tabId === 'bolt') {
            buildPoleClearanceTool(tabContent);
          } else {
            buildSingleClearanceTool(tabId, tabContent);
          }
        });
        
        btn.addEventListener('mouseenter', () => {
          if (!btn.classList.contains('active') && btn.style.borderBottomColor === 'transparent') {
            btn.style.backgroundColor = '#f0f4fa';
          }
        });
        
        btn.addEventListener('mouseleave', () => {
          if (!btn.classList.contains('active')) {
            btn.style.backgroundColor = 'transparent';
          }
        });
      });
      
      // Load initial tab
      buildSingleClearanceTool('gnd2com', tabContent);
    }
    
    // Pole Clearance Calculator - Special handling for power/communication separation
    function buildPoleClearanceTool(container) {
      if (!container) container = toolContent;
      
      const toolContainer = document.createElement('div');
      toolContainer.innerHTML = `
        <div class="tool-section">
          <h3>Power & Communication Attachment Heights</h3>
          <div style="background: #e3f2fd; border-left: 4px solid var(--color-accent); padding: 0.75rem; margin-bottom: 1rem; border-radius: 0 var(--radius) var(--radius) 0;">
            <div style="font-weight: bold; color: var(--color-primary); margin-bottom: 0.25rem;">📏 NESC Rule 235C - Pole Separation Requirements</div>
            <div style="font-size: 0.85rem; color: #555; line-height: 1.4;">
              Communication attachments must be at least <strong>40 inches (3'-4")</strong> below power attachments on joint-use poles.
            </div>
          </div>
          
          <div class="measurement-grid two-column">
            <div class="measurement-group">
              <label>Lowest Power Attachment Height</label>
              <div id="power-height-wrapper"></div>
            </div>
            <div class="measurement-group">
              <label>Communication Attachment Height</label>
              <div id="comm-height-wrapper"></div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 1.5rem 0;">
            <button id="pole-calc" class="btn">Check Separation</button>
          </div>
        </div>
        
        <div class="tool-section" id="pole-results" style="display:none;">
          <div id="pole-summary" style="padding: 1rem; border-radius: var(--radius); margin: 0 0 1rem 0; font-weight: bold;"></div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: var(--radius); padding: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 1.2em;">⚠️</span>
              <strong style="color: #856404;">Industry Disclaimer</strong>
            </div>
            <div style="font-size: 0.9rem; color: #856404; line-height: 1.4;">
              <strong>Due to the nature of our industry, there can be many exceptions or hidden conditions when dealing with clearances. 
              Make sure to find the source documentation to be 100% certain.</strong> Local utility standards may require greater separations than the minimum NESC requirements.
            </div>
          </div>
          
          <h3>Separation Analysis</h3>
          <div style="background: white; border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow);">
            <div id="pole-calculation" style="font-size: 1.1rem; line-height: 1.6;"></div>
          </div>
          
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
            <button id="pole-copy-results" class="btn secondary">Copy Analysis Report</button>
            <button id="pole-clear" class="btn secondary">Clear Results</button>
          </div>
        </div>
      `;
      
      container.appendChild(toolContainer);
      
      const resultsSection = toolContainer.querySelector('#pole-results');
      const summaryEl = toolContainer.querySelector('#pole-summary');
      const calculationEl = toolContainer.querySelector('#pole-calculation');
      const calcBtn = toolContainer.querySelector('#pole-calc');
      const clearBtn = toolContainer.querySelector('#pole-clear');
      const copyResultsBtn = toolContainer.querySelector('#pole-copy-results');
      
      let lastResults = null;
      let powerHeightInput = null;
      let commHeightInput = null;
      
      function initializeInputs() {
        // Create smart inputs for both heights
        const powerWrapper = toolContainer.querySelector('#power-height-wrapper');
        const commWrapper = toolContainer.querySelector('#comm-height-wrapper');
        
        powerHeightInput = SmartInput.createSmartInput('25-0', 'Lowest power attachment height');
        commHeightInput = SmartInput.createSmartInput('21-8', 'Communication attachment height');
        
        powerWrapper.appendChild(powerHeightInput.wrapper);
        commWrapper.appendChild(commHeightInput.wrapper);
        
        // Add tooltip for pole clearance inputs
        const tooltipWrapper = document.createElement('div');
        tooltipWrapper.style.marginTop = '1rem';
        tooltipWrapper.style.textAlign = 'center';
        const poleTooltip = UI.createTooltip('Input Help', {
          formats: [
            { example: '25-0', description: 'Fastest format' },
            { example: '25\'0"', description: 'Traditional' },
            { example: '25 0', description: 'Space separated' },
            { example: '25', description: 'Feet only' }
          ],
          shortcuts: [
            { key: 'Enter', description: 'Check separation' },
            { key: 'Tab', description: 'Next field' },
            { key: 'Esc', description: 'Clear inputs' }
          ]
        });
        tooltipWrapper.appendChild(poleTooltip);
        powerWrapper.appendChild(tooltipWrapper);
        
        // Add keyboard navigation
        powerHeightInput.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commHeightInput.input.focus();
          }
          if (e.key === 'Escape') {
            clearInputs();
            e.preventDefault();
          }
        });
        
        commHeightInput.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            checkSeparation();
          }
          if (e.key === 'Escape') {
            clearInputs();
            e.preventDefault();
          }
        });
        
        // Focus the first input
        powerHeightInput.input.focus();
      }
      
      function checkSeparation() {
        const hideLoading = UI.showLoading(calcBtn, 'Calculating...');
        
        try {
          // Validate both inputs
          const powerResult = SmartInput.getValue(powerHeightInput.input);
          const commResult = SmartInput.getValue(commHeightInput.input);
          
          if (!powerResult.isValid) {
            UI.showAlert(`Power height error: ${powerResult.error}`, 'error');
            powerHeightInput.input.focus();
            hideLoading();
            return;
          }
          
          if (!commResult.isValid) {
            UI.showAlert(`Communication height error: ${commResult.error}`, 'error');
            commHeightInput.input.focus();
            hideLoading();
            return;
          }
          
          // Calculate separation
          const separationInches = powerResult.totalInches - commResult.totalInches;
          const requiredSeparationInches = 40; // 40 inches minimum per NESC Rule 235C
          const meets = separationInches >= requiredSeparationInches;
          const marginInches = separationInches - requiredSeparationInches;
          const marginObj = fromTotalInches(Math.abs(marginInches));
          const separationObj = fromTotalInches(separationInches);
          
          // Update summary
          summaryEl.style.backgroundColor = meets ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
          summaryEl.style.color = meets ? 'var(--color-success)' : 'var(--color-error)';
          summaryEl.style.border = `2px solid ${meets ? 'var(--color-success)' : 'var(--color-error)'}`;
          summaryEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; justify-content: space-between;">
              <div>
                <div style="font-size: 1.4rem; font-weight: bold;">
                  ${meets ? '✅ NESC COMPLIANT' : '❌ NON-COMPLIANT'}
                </div>
                <div style="font-size: 1rem; margin-top: 0.25rem;">
                  Actual separation: <strong>${separationObj.ft}'-${separationObj.in}"</strong>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight: bold;">
                  Required: 3'-4" (40")
                </div>
                <div style="font-size: 0.9rem; opacity: 0.8;">
                  NESC Rule 235C
                </div>
              </div>
            </div>
          `;
          
          // Update detailed calculation
          calculationEl.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center;">
              <div style="text-align: center;">
                <div style="background: #e3f2fd; padding: 1rem; border-radius: var(--radius);">
                  <div style="font-weight: bold; color: var(--color-primary);">Power Attachment</div>
                  <div style="font-size: 1.2rem; margin: 0.5rem 0;">${powerResult.formatted}</div>
                  <div style="font-size: 0.9rem; color: #666;">(${powerResult.totalInches} inches)</div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <div style="font-size: 2rem; color: ${meets ? 'var(--color-success)' : 'var(--color-error)'};">
                  ${meets ? '✓' : '✗'}
                </div>
                <div style="font-weight: bold; color: ${meets ? 'var(--color-success)' : 'var(--color-error)'};">
                  ${separationObj.ft}'-${separationObj.in}"
                </div>
                <div style="font-size: 0.8rem; color: #666;">separation</div>
              </div>
              
              <div style="text-align: center;">
                <div style="background: #f3e5f5; padding: 1rem; border-radius: var(--radius);">
                  <div style="font-weight: bold; color: #7b1fa2;">Communication Attachment</div>
                  <div style="font-size: 1.2rem; margin: 0.5rem 0;">${commResult.formatted}</div>
                  <div style="font-size: 0.9rem; color: #666;">(${commResult.totalInches} inches)</div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 1.5rem; text-align: center; font-size: 1.1rem;">
              <div style="margin-bottom: 0.5rem;">
                <strong>Analysis:</strong> ${meets ? 'PASS' : 'FAIL'}
              </div>
              <div style="color: ${meets ? 'var(--color-success)' : 'var(--color-error)'};">
                Margin: <strong>${marginInches >= 0 ? '+' : '-'}${marginObj.ft}'-${marginObj.in}"</strong> 
                ${meets ? 'above minimum' : 'below minimum'}
              </div>
            </div>
          `;
          
          // Store results for copying
          lastResults = {
            powerHeight: powerResult.formatted,
            commHeight: commResult.formatted,
            separation: `${separationObj.ft}'-${separationObj.in}"`,
            separationInches: separationInches,
            required: "3'-4\" (40 inches)",
            meets: meets,
            margin: `${marginInches >= 0 ? '+' : '-'}${marginObj.ft}'-${marginObj.in}"`,
            marginInches: marginInches
          };
          
          resultsSection.style.display = 'block';
          copyResultsBtn.disabled = false;
          
          const alertType = meets ? 'success' : 'error';
          const message = meets 
            ? `✅ Pole separation meets NESC requirements!`
            : `❌ Insufficient separation: ${separationObj.ft}'-${separationObj.in}" (need 3'-4")`;
          UI.showAlert(message, alertType);
          
        } catch (error) {
          console.error('Pole separation calculation error:', error);
          UI.showAlert('An error occurred during separation calculation', 'error');
        } finally {
          hideLoading();
        }
      }
      
      function clearInputs() {
        powerHeightInput.input.value = '';
        commHeightInput.input.value = '';
        powerHeightInput.input.classList.remove('input-valid', 'input-invalid', 'input-empty');
        commHeightInput.input.classList.remove('input-valid', 'input-invalid', 'input-empty');
        powerHeightInput.input.classList.add('input-empty');
        commHeightInput.input.classList.add('input-empty');
        // Trigger validation to reset feedback
        powerHeightInput.input.dispatchEvent(new Event('input'));
        commHeightInput.input.dispatchEvent(new Event('input'));
        resultsSection.style.display = 'none';
        copyResultsBtn.disabled = true;
        lastResults = null;
        powerHeightInput.input.focus();
      }
      
      function clearResults() {
        resultsSection.style.display = 'none';
        copyResultsBtn.disabled = true;
        lastResults = null;
        powerHeightInput.input.focus();
      }
      
      function copyResults() {
        if (!lastResults) return;
        
        const timestamp = new Date().toLocaleString();
        let resultText = `NESC-2023 POLE SEPARATION ANALYSIS REPORT
Generated: ${timestamp}
Tool: Communication Worker Safety & Pole Clearances (NESC-2023)

ATTACHMENT HEIGHTS:
Power Attachment (Lowest): ${lastResults.powerHeight}
Communication Attachment: ${lastResults.commHeight}

SEPARATION ANALYSIS:
Measured Separation: ${lastResults.separation} (${lastResults.separationInches} inches)
Required Minimum: ${lastResults.required} per NESC Rule 235C
Compliance Status: ${lastResults.meets ? 'PASS' : 'FAIL'}
Margin: ${lastResults.margin} ${lastResults.meets ? 'above minimum' : 'below minimum'}

IMPORTANT DISCLAIMER:
Due to the nature of our industry, there can be many exceptions or hidden 
conditions when dealing with clearances. Make sure to find the source 
documentation to be 100% certain. Local utility standards may require 
greater separations than the minimum NESC requirements.

This analysis is based on NESC-2023 Rule 235C - Communication Worker Safety Zone.
Generated by TechTools - Professional Utility Standards Calculator`;
        
        UI.copyToClipboard(resultText, 'Pole separation analysis copied to clipboard!');
      }
      
      // Event listeners
      calcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        checkSeparation();
      });
      
      clearBtn.addEventListener('click', clearResults);
      copyResultsBtn.addEventListener('click', copyResults);
      
      // Initialize the inputs
      initializeInputs();
    }

    // NESC-2023 Clearance Rules (Rule 232, Table 232-1 and related)
    const clearanceDefaults = {
      gnd2com: [
        // Transportation Infrastructure
        { id: 'railroad_tracks', label: 'Track rails of railroads (non-electrified) - NESC Rule 232', requiredFt: 23, requiredIn: 6 },
        { id: 'roads_truck_traffic', label: 'Roads, streets subject to truck traffic - NESC Rule 232', requiredFt: 15, requiredIn: 6 },
        { id: 'alleys_no_trucks', label: 'Alleys, driveways not subject to truck traffic - NESC Rule 232', requiredFt: 15, requiredIn: 6 },
        { id: 'vehicle_areas', label: 'Other areas traversed by vehicles (grazing, orchards) - NESC Rule 232', requiredFt: 15, requiredIn: 6 },
        { id: 'highway_parallel', label: 'Lines along highways (not crossing roadway) - NESC Rule 232', requiredFt: 15, requiredIn: 6 },
        { id: 'restricted_vehicle', label: 'Roads unlikely for vehicle passage (fenced alleys) - NESC Rule 232', requiredFt: 13, requiredIn: 6 },
        
        // Pedestrian Areas
        { id: 'pedestrian_only', label: 'Pedestrian or restricted traffic areas only - NESC Rule 232', requiredFt: 9, requiredIn: 6 },
        
        // Water Areas
        { id: 'water_no_sailing', label: 'Water areas not suitable for sailboating - NESC Rule 232', requiredFt: 14, requiredIn: 0 },
        { id: 'water_sailing_small', label: 'Water suitable for sailboating (< 20 acres) - NESC Rule 232', requiredFt: 17, requiredIn: 6 },
        { id: 'water_sailing_medium', label: 'Water suitable for sailboating (20-200 acres) - NESC Rule 232', requiredFt: 25, requiredIn: 6 },
        { id: 'water_sailing_large', label: 'Water suitable for sailboating (200-2000 acres) - NESC Rule 232', requiredFt: 31, requiredIn: 6 },
        { id: 'water_sailing_xlarge', label: 'Water suitable for sailboating (> 2000 acres) - NESC Rule 232', requiredFt: 37, requiredIn: 6 },
        
        // Service Drop Exceptions
        { id: 'residential_driveway', label: 'Insulated communication service drops over residential driveways - NESC Rule 232', requiredFt: 11, requiredIn: 6 }
      ],
      
      gnd2pwr: [
        // Transportation Infrastructure - Supply Cables (0-750V)
        { id: 'railroad_supply', label: 'Track rails of railroads - Supply cables - NESC Rule 232', requiredFt: 24, requiredIn: 0 },
        { id: 'railroad_open', label: 'Track rails of railroads - Open supply conductors - NESC Rule 232', requiredFt: 25, requiredIn: 4 },
        { id: 'roads_supply', label: 'Roads, streets subject to truck traffic - Supply cables (0-750V) - NESC Rule 232', requiredFt: 16, requiredIn: 6 },
        { id: 'roads_open', label: 'Roads, streets subject to truck traffic - Open supply conductors - NESC Rule 232', requiredFt: 18, requiredIn: 6 },
        { id: 'alleys_supply', label: 'Alleys, driveways not subject to truck traffic - Supply cables - NESC Rule 232', requiredFt: 16, requiredIn: 6 },
        { id: 'vehicle_supply', label: 'Other areas traversed by vehicles - Supply cables - NESC Rule 232', requiredFt: 16, requiredIn: 6 },
        { id: 'highway_supply', label: 'Lines along highways (not crossing) - Supply cables - NESC Rule 232', requiredFt: 16, requiredIn: 6 },
        { id: 'restricted_supply', label: 'Roads unlikely for vehicles - Supply cables - NESC Rule 232', requiredFt: 14, requiredIn: 0 },
        
        // Pedestrian Areas
        { id: 'pedestrian_supply', label: 'Pedestrian areas - Supply cables - NESC Rule 232', requiredFt: 12, requiredIn: 6 },
        
        // Water Areas - Supply Cables  
        { id: 'water_supply_no_sailing', label: 'Water not suitable for sailboating - Supply cables - NESC Rule 232', requiredFt: 14, requiredIn: 6 },
        { id: 'water_supply_small', label: 'Water suitable for sailboating (< 20 acres) - Supply - NESC Rule 232', requiredFt: 18, requiredIn: 6 },
        { id: 'water_supply_medium', label: 'Water suitable for sailboating (20-200 acres) - Supply - NESC Rule 232', requiredFt: 28, requiredIn: 6 },
        { id: 'water_supply_large', label: 'Water suitable for sailboating (200-2000 acres) - Supply - NESC Rule 232', requiredFt: 34, requiredIn: 6 },
        { id: 'water_supply_xlarge', label: 'Water suitable for sailboating (> 2000 acres) - Supply - NESC Rule 232', requiredFt: 40, requiredIn: 6 }
      ],
      
      bolt: [
        // Note: Pole clearance calculator now uses dedicated buildPoleClearanceTool function
        // These rules are preserved for potential future features or export compatibility
        { id: 'supply_separation', label: 'Communication space below supply conductors (≤8.7kV) - NESC Rule 235C', requiredFt: 3, requiredIn: 4 }
      ]
    };
    
    // Individual clearance calculator - Enhanced version
    function buildSingleClearanceTool(type, container) {
      if (!container) container = toolContent;
      
      const rulesKey = `clearanceRules-${type}`;
      let rules = clearanceDefaults[type].map(r => ({ ...r }));
      
      // Load saved rules with enhanced error handling
      const savedRules = Storage.load(rulesKey, null);
      if (savedRules && Array.isArray(savedRules)) {
        rules = savedRules;
      }
      
      const toolContainer = document.createElement('div');
      const titles = {
        gnd2com: 'Ground to Communication Clearance (NESC-2023)',
        gnd2pwr: 'Ground to Power Clearance (NESC-2023)', 
        bolt: 'Communication Worker Safety & Pole Clearances (NESC-2023)'
      };
      
      toolContainer.innerHTML = `
        <div class="tool-section" id="clr-input-section">
          <h3>Enter Your Measured Clearance</h3>
          <div style="background: #e3f2fd; border-left: 4px solid var(--color-accent); padding: 0.75rem; margin-bottom: 1rem; border-radius: 0 var(--radius) var(--radius) 0;">
            <div style="font-weight: bold; color: var(--color-primary); margin-bottom: 0.25rem;">📋 NESC-2023 Compliant Standards</div>
            <div style="font-size: 0.85rem; color: #555; line-height: 1.4;">
              Enter your measured clearance once and see how it compares against all applicable NESC-2023 requirements.
            </div>
          </div>
          
          <div class="measurement-grid two-column">
            <div class="measurement-group">
              <label>Your Measured Clearance</label>
              <div id="clr-input-wrapper"></div>
            </div>
            <div class="measurement-group">
              <div style="padding-top: 2rem;">
                <button id="clr-calc" class="btn">Check Against All Standards</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tool-section" id="clr-results" style="display:none;">
          <div id="clr-summary" style="padding: 1rem; border-radius: var(--radius); margin: 0 0 1rem 0; font-weight: bold;"></div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: var(--radius); padding: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 1.2em;">⚠️</span>
              <strong style="color: #856404;">Industry Disclaimer</strong>
            </div>
            <div style="font-size: 0.9rem; color: #856404; line-height: 1.4;">
              <strong>Due to the nature of our industry, there can be many exceptions or hidden conditions when dealing with clearances. 
              Make sure to find the source documentation to be 100% certain.</strong> Local utility standards, railroad agencies, 
              bridge authorities, or environmental conditions may require different clearances than shown.
            </div>
          </div>
          
          <h3>Clearance Compliance Results</h3>
          <div style="overflow-x: auto;">
            <table class="clearance-table">
              <thead>
                <tr>
                  <th style="min-width: 300px;">Clearance Requirement (NESC Rule)</th>
                  <th>Required Min.</th>
                  <th>Your Measurement</th>
                  <th>Status</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody id="clr-table-body"></tbody>
            </table>
          </div>
          
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
            <button id="clr-copy-results" class="btn secondary">Copy Compliance Report</button>
            <button id="clr-clear" class="btn secondary">Clear Results</button>
          </div>
        </div>
      `;
      
      container.appendChild(toolContainer);
      
      const resultsSection = toolContainer.querySelector('#clr-results');
      const summaryEl = toolContainer.querySelector('#clr-summary');
      const tableBody = toolContainer.querySelector('#clr-table-body');
      const calcBtn = toolContainer.querySelector('#clr-calc');
      const clearBtn = toolContainer.querySelector('#clr-clear');
      const copyResultsBtn = toolContainer.querySelector('#clr-copy-results');
      
      let lastResults = null;
      let measurementInput = null;
      
      function initializeInput() {
        // Create single smart input for measurement
        const inputWrapper = toolContainer.querySelector('#clr-input-wrapper');
        measurementInput = SmartInput.createSmartInput('15-6', 'Your measured clearance');
        inputWrapper.appendChild(measurementInput.wrapper);
        
        // Add tooltip for clearance input
        const tooltipWrapper = document.createElement('div');
        tooltipWrapper.style.marginTop = '0.5rem';
        const clearanceTooltip = UI.createTooltip('Input Help', {
          formats: [
            { example: '15-6', description: 'Fastest format' },
            { example: '15\'6"', description: 'Traditional' },
            { example: '15 6', description: 'Space separated' },
            { example: '15', description: 'Feet only' }
          ],
          shortcuts: [
            { key: 'Enter', description: 'Check clearances' },
            { key: 'Esc', description: 'Clear input' }
          ]
        });
        tooltipWrapper.appendChild(clearanceTooltip);
        inputWrapper.appendChild(tooltipWrapper);
        
        // Add keyboard navigation
        measurementInput.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            checkClearances();
          }
          if (e.key === 'Escape') {
            clearInput();
            e.preventDefault();
          }
        });
        
        // Focus the input
        measurementInput.input.focus();
      }
      
      function checkClearances() {
        const hideLoading = UI.showLoading(calcBtn, 'Checking...');
        
        try {
          // Validate the single measurement input
          const measuredValue = SmartInput.getValue(measurementInput.input);
          
          if (!measuredValue.isValid) {
            UI.showAlert(`Measurement error: ${measuredValue.error}`, 'error');
            measurementInput.input.focus();
            hideLoading();
            return;
          }
          
          // Check the single measurement against ALL rules
          tableBody.innerHTML = '';
          const results = [];
          let totalPassed = 0;
          let totalFailed = 0;
          
          rules.forEach((rule, idx) => {
            const requiredTotal = toTotalInches(rule.requiredFt, rule.requiredIn);
            const diff = measuredValue.totalInches - requiredTotal;
            const pass = diff >= 0;
            const diffObj = fromTotalInches(Math.abs(diff));
            
            if (pass) totalPassed++;
            else totalFailed++;
            
            const result = {
              rule: rule.label,
              required: `${rule.requiredFt}'-${rule.requiredIn}"`,
              measured: measuredValue.formatted,
              pass: pass,
              margin: `${pass ? '+' : '-'}${diffObj.ft}'-${diffObj.in}"`,
              marginInches: diff
            };
            results.push(result);
            
            const tr = document.createElement('tr');
            tr.className = pass ? 'clearance-pass' : 'clearance-fail';
            tr.innerHTML = `
              <td style="font-size: 0.9rem; padding: 0.75rem 0.5rem;">${rule.label}</td>
              <td style="text-align: center; font-weight: bold;">${rule.requiredFt}'-${rule.requiredIn}"</td>
              <td style="text-align: center; font-weight: bold;">${measuredValue.formatted}</td>
              <td style="text-align: center;" class="${pass ? 'pass' : 'fail'}">
                <span style="padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold; 
                      background: ${pass ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'}; 
                      color: ${pass ? 'var(--color-success)' : 'var(--color-error)'};">
                  ${pass ? 'PASS ✓' : 'FAIL ✗'}
                </span>
              </td>
              <td style="text-align: center; font-weight: bold; color: ${pass ? 'var(--color-success)' : 'var(--color-error)'};">
                ${pass ? '+' : '-'}${diffObj.ft}'-${diffObj.in}"
              </td>
            `;
            tableBody.appendChild(tr);
          });
          
          // Update summary
          const overallPass = totalFailed === 0;
          summaryEl.style.backgroundColor = overallPass ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
          summaryEl.style.color = overallPass ? 'var(--color-success)' : 'var(--color-error)';
          summaryEl.style.border = `2px solid ${overallPass ? 'var(--color-success)' : 'var(--color-error)'}`;
          summaryEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; justify-content: space-between;">
              <div>
                <div style="font-size: 1.4rem; font-weight: bold;">
                  ${overallPass ? '✅ COMPLIANCE ACHIEVED' : '❌ NON-COMPLIANT'}
                </div>
                <div style="font-size: 1rem; margin-top: 0.25rem;">
                  Your measurement: <strong>${measuredValue.formatted}</strong>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight: bold;">
                  ${totalPassed} PASS / ${totalFailed} FAIL
                </div>
                <div style="font-size: 0.9rem; opacity: 0.8;">
                  ${totalPassed + totalFailed} total checks
                </div>
              </div>
            </div>
          `;
          
          // Store results for copying
          lastResults = {
            type: titles[type],
            measurement: measuredValue.formatted,
            measurementInches: measuredValue.totalInches,
            overall: overallPass ? 'PASS' : 'FAIL',
            passed: totalPassed,
            failed: totalFailed,
            details: results
          };
          
          resultsSection.style.display = 'block';
          copyResultsBtn.disabled = false;
          
          const alertType = overallPass ? 'success' : 'error';
          const message = overallPass 
            ? `✅ All ${totalPassed} clearance standards met!`
            : `❌ ${totalFailed} of ${totalPassed + totalFailed} standards failed!`;
          UI.showAlert(message, alertType);
          
        } catch (error) {
          console.error('Clearance check error:', error);
          UI.showAlert('An error occurred during clearance checking', 'error');
        } finally {
          hideLoading();
        }
      }
      
      function clearInput() {
        measurementInput.input.value = '';
        measurementInput.input.classList.remove('input-valid', 'input-invalid', 'input-empty');
        measurementInput.input.classList.add('input-empty');
        // Trigger validation to reset feedback
        measurementInput.input.dispatchEvent(new Event('input'));
        resultsSection.style.display = 'none';
        copyResultsBtn.disabled = true;
        lastResults = null;
        measurementInput.input.focus();
      }
      
      function clearResults() {
        resultsSection.style.display = 'none';
        copyResultsBtn.disabled = true;
        lastResults = null;
        measurementInput.input.focus();
      }
      
      function copyResults() {
        if (!lastResults) return;
        
        const timestamp = new Date().toLocaleString();
        let resultText = `NESC-2023 CLEARANCE COMPLIANCE REPORT
Generated: ${timestamp}
Tool: ${lastResults.type}

MEASUREMENT SUMMARY:
Your Measured Clearance: ${lastResults.measurement} (${lastResults.measurementInches} total inches)
Overall Compliance Status: ${lastResults.overall}
Standards Met: ${lastResults.passed} of ${lastResults.passed + lastResults.failed}

DETAILED COMPLIANCE RESULTS:
${'='.repeat(80)}
`;
        
        // Sort results by pass/fail for better readability
        const sortedResults = [...lastResults.details].sort((a, b) => {
          if (a.pass === b.pass) return a.marginInches - b.marginInches; // Sort by margin within pass/fail groups
          return a.pass ? 1 : -1; // Failed items first
        });
        
        sortedResults.forEach(detail => {
          resultText += `\n${detail.pass ? '✓' : '✗'} ${detail.rule}
   Required: ${detail.required} | Measured: ${detail.measured} | Status: ${detail.pass ? 'PASS' : 'FAIL'} | Margin: ${detail.margin}\n`;
        });
        
        resultText += `\n${'='.repeat(80)}
IMPORTANT DISCLAIMER:
Due to the nature of our industry, there can be many exceptions or hidden 
conditions when dealing with clearances. Make sure to find the source 
documentation to be 100% certain. Local utility standards, railroad agencies, 
bridge authorities, or environmental conditions may require different clearances.

This report is based on NESC-2023 Rules 232-239.
Generated by TechTools - Professional Utility Standards Calculator`;
        
        UI.copyToClipboard(resultText, 'Compliance report copied to clipboard!');
      }
      
      // Event listeners
      calcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        checkClearances();
      });
      
      clearBtn.addEventListener('click', clearResults);
      copyResultsBtn.addEventListener('click', copyResults);
      
      // Initialize the single input
      initializeInput();
    }

    // Checklist tool
    function buildChecklistTool() {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="tool-section" id="qc-editor-section">
          <label for="qc-template">Template (one item per line, prefix section headers with ###):</label>
          <textarea id="qc-template" rows="8"></textarea>
          <div class="tool-section">
            <button id="qc-save" class="btn">Save Template</button>
            <button id="qc-load" class="btn secondary">Load Template</button>
            <button id="qc-import" class="btn secondary">Import JSON</button>
            <button id="qc-export" class="btn secondary">Export JSON</button>
            <input type="file" id="qc-file-input" accept="application/json" style="display:none" />
          </div>
          <button id="qc-start" class="btn">Start Checklist</button>
        </div>
        <div class="tool-section hidden" id="qc-run-section">
          <h3>Checklist</h3>
          <div id="qc-list" class="checklist-section"></div>
          <div class="tool-section">
            <button id="qc-copy-text" class="btn secondary">Copy as Text</button>
            <button id="qc-copy-json" class="btn secondary">Copy as JSON</button>
            <button id="qc-back" class="btn secondary">Back to Editor</button>
          </div>
        </div>
      `;
      toolContent.appendChild(container);
      
      const templateArea = container.querySelector('#qc-template');
      const saveBtn = container.querySelector('#qc-save');
      const loadBtn = container.querySelector('#qc-load');
      const importBtn = container.querySelector('#qc-import');
      const exportBtn = container.querySelector('#qc-export');
      const startBtn = container.querySelector('#qc-start');
      const runSection = container.querySelector('#qc-run-section');
      const editorSection = container.querySelector('#qc-editor-section');
      const listDiv = container.querySelector('#qc-list');
      const copyTextBtn = container.querySelector('#qc-copy-text');
      const copyJsonBtn = container.querySelector('#qc-copy-json');
      const backBtn = container.querySelector('#qc-back');
      const fileInput = container.querySelector('#qc-file-input');
      
      const tplKey = 'qcTemplate';
      const storedTpl = localStorage.getItem(tplKey);
      if (storedTpl) templateArea.value = storedTpl;
      
      function parseTemplate(text) {
        const lines = text.split(/\r?\n/);
        const items = [];
        lines.forEach((line) => {
          if (!line.trim()) return;
          if (line.startsWith('###')) {
            items.push({ type: 'section', text: line.replace(/^#+/, '').trim() });
          } else {
            items.push({ type: 'item', text: line.trim(), checked: false });
          }
        });
        return items;
      }
      
      function renderChecklist(items) {
        listDiv.innerHTML = '';
        items.forEach((itm) => {
          if (itm.type === 'section') {
            const h = document.createElement('h4');
            h.textContent = itm.text;
            h.style.marginTop = '1rem';
            h.style.fontFamily = getComputedStyle(document.body).getPropertyValue('--font-heading');
            listDiv.appendChild(h);
          } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'checklist-item';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '0.5rem';
            wrapper.style.marginBottom = '0.5rem';
            wrapper.style.padding = '0.5rem';
            wrapper.style.borderRadius = 'var(--radius)';
            wrapper.style.transition = 'background-color var(--transition-fast)';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = itm.checked;
            checkbox.style.marginRight = '0.5rem';
            checkbox.addEventListener('change', () => {
              itm.checked = checkbox.checked;
              wrapper.style.backgroundColor = itm.checked ? 'rgba(40, 167, 69, 0.05)' : 'transparent';
            });
            
            const label = document.createElement('label');
            label.textContent = itm.text;
            label.style.flex = '1';
            label.style.cursor = 'pointer';
            label.addEventListener('click', () => {
              checkbox.checked = !checkbox.checked;
              checkbox.dispatchEvent(new Event('change'));
            });
            
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            listDiv.appendChild(wrapper);
            
            // Set initial background
            wrapper.style.backgroundColor = itm.checked ? 'rgba(40, 167, 69, 0.05)' : 'transparent';
          }
        });
      }
      
      saveBtn.addEventListener('click', () => {
        localStorage.setItem(tplKey, templateArea.value);
        UI.showAlert('Template saved', 'success');
      });
      
      loadBtn.addEventListener('click', () => {
        const saved = localStorage.getItem(tplKey);
        if (saved) {
          templateArea.value = saved;
          UI.showAlert('Template loaded', 'success');
        } else {
          UI.showAlert('No saved template found', 'warning');
        }
      });
      
      importBtn.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            if (Array.isArray(data)) {
              const lines = data.map((itm) => (itm.type === 'section' ? '### ' + itm.text : itm.text));
              templateArea.value = lines.join('\n');
              localStorage.setItem(tplKey, templateArea.value);
              UI.showAlert('Template imported', 'success');
            }
          } catch {
            UI.showAlert('Invalid JSON file', 'error');
          }
        };
        reader.readAsText(file);
        fileInput.value = '';
      });
      
      exportBtn.addEventListener('click', () => {
        const items = parseTemplate(templateArea.value);
        const json = JSON.stringify(items, null, 2);
        UI.copyToClipboard(json, 'Checklist JSON copied to clipboard!');
      });
      
      startBtn.addEventListener('click', () => {
        const items = parseTemplate(templateArea.value);
        if (!items.length) {
          UI.showAlert('Please enter a template to start', 'warning');
          return;
        }
        editorSection.classList.add('hidden');
        runSection.classList.remove('hidden');
        renderChecklist(items);
        
        copyTextBtn.onclick = () => {
          const lines = items.map((itm) => {
            if (itm.type === 'section') return '\n' + itm.text.toUpperCase();
            return `${itm.checked ? '☑' : '☐'} ${itm.text}`;
          });
          UI.copyToClipboard(lines.join('\n'), 'Checklist copied as text!');
        };
        
        copyJsonBtn.onclick = () => {
          const json = JSON.stringify(items, null, 2);
          UI.copyToClipboard(json, 'Checklist copied as JSON!');
        };
      });
      
      backBtn.addEventListener('click', () => {
        runSection.classList.add('hidden');
        editorSection.classList.remove('hidden');
        templateArea.focus();
      });
      
      // Focus template area
      templateArea.focus();
    }

  })();