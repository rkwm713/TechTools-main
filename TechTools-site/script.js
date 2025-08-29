// TechTools Web script
//
// This file powers the TechTools website. It mirrors the logic of the
// Chrome extension, providing a suite of calculators, a notes
// editor, a checklist manager and clearance checkers. Data is
// persisted using localStorage.

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
  
  // Input validation helpers
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
  const tileContainer = document.getElementById('tileContainer');
  const toolContent = document.getElementById('toolContent');
  const searchInput = document.getElementById('searchInput');

  // Define the available tools. Each tool specifies an id, a
  // user-friendly name, an icon relative to the website root and a
  // builder function invoked when the tool is opened.
  const tools = [
    {
      id: 'fi-calculator',
      name: 'Feet & Inches',
      icon: 'icons/fi.png',
      build: buildFiCalculator
    },
    {
      id: 'quic-note',
      name: 'QuiC Note',
      icon: 'icons/note.png',
      build: buildNotePad
    },
    {
      id: 'sag-calculator',
      name: 'Sag Calculator',
      icon: 'icons/sag.png',
      build: buildSagCalculator
    },
    {
      id: 'qc-checklist',
      name: 'Design/QC',
      icon: 'icons/checklist.png',
      build: buildChecklistTool
    },
    {
      id: 'gnd2com',
      name: 'GND2COM',
      icon: 'icons/gndcom.png',
      build: () => buildClearanceTool('gnd2com')
    },
    {
      id: 'gnd2pwr',
      name: 'GND2PWR',
      icon: 'icons/gndpwr.png',
      build: () => buildClearanceTool('gnd2pwr')
    },
    {
      id: 'bolt-clearance',
      name: 'Bolt Hole',
      icon: 'icons/bolt.png',
      build: () => buildClearanceTool('bolt')
    }
  ];

  function renderTiles(term = '') {
    tileContainer.innerHTML = '';
    const filtered = tools.filter(tool => tool.name.toLowerCase().includes(term.toLowerCase()));
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    filtered.forEach(tool => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.tabIndex = 0;
      tile.dataset.toolId = tool.id;
      tile.innerHTML = `
        <img src="${tool.icon}" alt="${tool.name} icon" class="tile-icon" />
        <div class="tile-name">${tool.name}</div>
      `;
      tile.addEventListener('click', () => openTool(tool));
      tile.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openTool(tool);
      });
      tileContainer.appendChild(tile);
    });
  }

  function openTool(tool) {
    tileContainer.classList.add('hidden');
    toolContent.classList.remove('hidden');
    toolContent.innerHTML = '';
    const backBtn = document.createElement('div');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15 5l-7 7 7 7" /></svg>
      <span>Back</span>
    `;
    backBtn.addEventListener('click', () => {
      toolContent.classList.add('hidden');
      tileContainer.classList.remove('hidden');
      searchInput.focus();
    });
    toolContent.appendChild(backBtn);
    tool.build();
    window.scrollTo(0, 0);
  }

  searchInput.addEventListener('input', (e) => {
    renderTiles(e.target.value);
  });

  renderTiles();

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

  // Feet & Inches Calculator - Enhanced version
  function buildFiCalculator() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h2>Feet & Inches Calculator</h2>
      <div class="tool-section">
        <h3>Measurements</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
        <label for="fi-high-ft">High measurement (feet)</label>
        <label for="fi-high-in">High measurement (inches)</label>
          <input type="number" id="fi-high-ft" min="0" placeholder="0" />
          <input type="number" id="fi-high-in" min="0" max="11" placeholder="0" />
          
        <label for="fi-low-ft">Low measurement (feet)</label>
        <label for="fi-low-in">Low measurement (inches)</label>
          <input type="number" id="fi-low-ft" min="0" placeholder="0" />
          <input type="number" id="fi-low-in" min="0" max="11" placeholder="0" />
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
      </div>
      <div class="tool-section">
        <h3>History</h3>
      <ul id="fi-results" class="results-list"></ul>
      </div>
    `;
    toolContent.appendChild(container);
    
    const inputs = [
      container.querySelector('#fi-high-ft'),
      container.querySelector('#fi-high-in'),
      container.querySelector('#fi-low-ft'),
      container.querySelector('#fi-low-in')
    ];
    const opSelect = container.querySelector('#fi-operation');
    const resultsList = container.querySelector('#fi-results');
    const calcBtn = container.querySelector('#fi-calc-btn');
    const clearBtn = container.querySelector('#fi-clear-btn');
    const historyKey = 'fiHistory';
    
    let history = Storage.load(historyKey, []);
    
    // Add real-time input validation
    inputs.forEach((input, idx) => {
      const isInches = input.id.includes('in');
      const maxVal = isInches ? 11 : null;
      
      input.addEventListener('input', () => {
        UI.validateInput(input, 0, maxVal);
      });
      
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
        // Validate all inputs
        let hasErrors = false;
        const values = inputs.map((input, idx) => {
          const isInches = input.id.includes('in');
          const maxVal = isInches ? 11 : null;
          const isValid = UI.validateInput(input, 0, maxVal);
          if (!isValid) hasErrors = true;
          return Validation.parseNumber(input.value);
        });
        
        if (hasErrors) {
          UI.showAlert('Please correct the highlighted input errors', 'error');
          hideLoading();
          return;
        }
        
        const [hf, hi, lf, li] = values;
        
        // Validate inches are not >= 12
        if (hi >= 12 || li >= 12) {
          UI.showAlert('Inches must be less than 12', 'error');
          hideLoading();
          return;
        }
        
      const highTotal = toTotalInches(hf, hi);
      const lowTotal = toTotalInches(lf, li);
      const resultTotal = opSelect.value === 'subtract' ? highTotal - lowTotal : highTotal + lowTotal;
      const { ft: rft, in: rin } = fromTotalInches(resultTotal);
        const display = `${rft}'-${rin}"`;
        
        const operationText = opSelect.value === 'subtract' 
          ? `${hf}'-${hi}" - ${lf}'-${li}" = ${display}`
          : `${hf}'-${hi}" + ${lf}'-${li}" = ${display}`;
        
        const entry = { 
          display, 
          totalInches: resultTotal, 
          operation: operationText,
          timestamp: new Date().toLocaleTimeString()
        };
        
        history.unshift(entry); // Add to beginning
        if (history.length > 4) history.pop(); // Remove oldest
        
        Storage.save(historyKey, history);
      updateHistoryList();
        
        UI.showAlert(`Result: ${display}`, 'success');
        
      } catch (error) {
        console.error('Calculation error:', error);
        UI.showAlert('An error occurred during calculation', 'error');
      } finally {
        hideLoading();
      }
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
    
    updateHistoryList();
  }

  // Note editor - Enhanced version
  function buildNotePad() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h2>QuiC Note</h2>
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
  }

  // Sag calculator
  // Sag calculator - Enhanced version
  function buildSagCalculator() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h2>Sag Calculator</h2>
      <div class="tool-section">
        <h3>Neutral Measurements</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
          <label for="sag-n1-ft">Neutral 1 (ft)</label>
          <label for="sag-n1-in">Neutral 1 (in)</label>
          <label for="sag-n2-ft">Neutral 2 (ft)</label>
          <label for="sag-n2-in">Neutral 2 (in)</label>
          <input type="number" id="sag-n1-ft" min="0" placeholder="0" />
          <input type="number" id="sag-n1-in" min="0" max="11" placeholder="0" />
          <input type="number" id="sag-n2-ft" min="0" placeholder="0" />
          <input type="number" id="sag-n2-in" min="0" max="11" placeholder="0" />
      </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
          <label for="sag-nmid-ft">Neutral Midspan (ft)</label>
          <label for="sag-nmid-in">Neutral Midspan (in)</label>
          <input type="number" id="sag-nmid-ft" min="0" placeholder="0" />
          <input type="number" id="sag-nmid-in" min="0" max="11" placeholder="0" />
        </div>
        
        <h3>Proposed Fiber Measurements</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
          <label for="sag-f1-ft">Fiber 1 (ft)</label>
          <label for="sag-f1-in">Fiber 1 (in)</label>
          <label for="sag-f2-ft">Fiber 2 (ft)</label>
          <label for="sag-f2-in">Fiber 2 (in)</label>
          <input type="number" id="sag-f1-ft" min="0" placeholder="0" />
          <input type="number" id="sag-f1-in" min="0" max="11" placeholder="0" />
          <input type="number" id="sag-f2-ft" min="0" placeholder="0" />
          <input type="number" id="sag-f2-in" min="0" max="11" placeholder="0" />
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
    
    const inputIds = ['n1-ft','n1-in','n2-ft','n2-in','nmid-ft','nmid-in','f1-ft','f1-in','f2-ft','f2-in'];
    const inputs = {};
    inputIds.forEach(id => {
      inputs[id.replace('-', '')] = container.querySelector(`#sag-${id}`);
    });
    
    const resultsSection = container.querySelector('#sag-results');
    const summaryEl = container.querySelector('#sag-summary');
    const detailsEl = container.querySelector('#sag-details');
    const factorEl = container.querySelector('#sag-factor');
    const fiberEl = container.querySelector('#sag-fiber');
    const calcBtn = container.querySelector('#sag-calc');
    const clearBtn = container.querySelector('#sag-clear');
    const copyBtn = container.querySelector('#sag-copy');
    
    let lastResults = null;
    
    // Add input validation and Enter key navigation
    Object.values(inputs).forEach((input, idx) => {
      const isInches = input.id.includes('in');
      const maxVal = isInches ? 11 : null;
      
      input.addEventListener('input', () => {
        UI.validateInput(input, 0, maxVal);
        copyBtn.disabled = true; // Disable copy until new calculation
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const inputArray = Object.values(inputs);
          if (idx < inputArray.length - 1) {
            inputArray[idx + 1].focus();
          } else {
            calculate();
          }
        }
      });
    });
    
    function calculate() {
      const hideLoading = UI.showLoading(calcBtn, 'Calculating...');
      
      try {
        // Validate all inputs
        let hasErrors = false;
        const values = {};
        
        Object.entries(inputs).forEach(([key, input]) => {
          const isInches = input.id.includes('in');
          const maxVal = isInches ? 11 : null;
          const isValid = UI.validateInput(input, 0, maxVal);
          if (!isValid) hasErrors = true;
          values[key] = Validation.parseNumber(input.value);
        });
        
        if (hasErrors) {
          UI.showAlert('Please correct the highlighted input errors', 'error');
        return;
      }
        
        // Validate critical measurements
        const nmidTotal = toTotalInches(values.nmidft, values.nmidin);
        if (nmidTotal <= 0) {
          UI.showAlert('Neutral midspan must be greater than zero', 'error');
          return;
        }
        
        // Validate that fiber measurements are provided
        const f1Total = toTotalInches(values.f1ft, values.f1in);
        const f2Total = toTotalInches(values.f2ft, values.f2in);
        if (f1Total <= 0 || f2Total <= 0) {
          UI.showAlert('Both fiber measurements must be greater than zero', 'error');
          return;
        }
        
        // Perform calculations
        const n1Dec = toTotalInches(values.n1ft, values.n1in) / 12;
        const n2Dec = toTotalInches(values.n2ft, values.n2in) / 12;
        const nmidDec = nmidTotal / 12;
        const f1Dec = f1Total / 12;
        const f2Dec = f2Total / 12;
        
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
            n1: `${values.n1ft}'-${values.n1in}"`,
            n2: `${values.n2ft}'-${values.n2in}"`,
            nmid: `${values.nmidft}'-${values.nmidin}"`,
            f1: `${values.f1ft}'-${values.f1in}"`,
            f2: `${values.f2ft}'-${values.f2in}"`
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
        Object.values(inputs).forEach(input => {
          input.value = '';
          input.classList.remove('input-error', 'input-success');
        });
        resultsSection.style.display = 'none';
        copyBtn.disabled = true;
        lastResults = null;
        UI.showAlert('All inputs cleared', 'success');
        inputs.n1ft.focus();
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
    inputs.n1ft.focus();
  }

  // Checklist tool
  function buildChecklistTool() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h2>Design/QC Checklist</h2>
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
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = itm.checked;
          checkbox.addEventListener('change', () => {
            itm.checked = checkbox.checked;
          });
          const label = document.createElement('label');
          label.textContent = itm.text;
          wrapper.appendChild(checkbox);
          wrapper.appendChild(label);
          listDiv.appendChild(wrapper);
        }
      });
    }
    saveBtn.addEventListener('click', () => {
      localStorage.setItem(tplKey, templateArea.value);
      alert('Template saved.');
    });
    loadBtn.addEventListener('click', () => {
      const saved = localStorage.getItem(tplKey);
      if (saved) templateArea.value = saved;
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
            alert('Template imported.');
          }
        } catch {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
    exportBtn.addEventListener('click', () => {
      const items = parseTemplate(templateArea.value);
      const json = JSON.stringify(items, null, 2);
      navigator.clipboard.writeText(json);
      alert('Checklist JSON copied to clipboard.');
    });
    startBtn.addEventListener('click', () => {
      const items = parseTemplate(templateArea.value);
      if (!items.length) {
        alert('Please enter a template to start.');
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
        navigator.clipboard.writeText(lines.join('\n'));
      };
      copyJsonBtn.onclick = () => {
        const json = JSON.stringify(items, null, 2);
        navigator.clipboard.writeText(json);
      };
    });
  }

  // Clearance calculators configuration and builder
  const clearanceDefaults = {
    gnd2com: [
      { id: 'min_comm_ground_clearance', label: 'Minimum ground to communication clearance', requiredFt: 15, requiredIn: 6 }
    ],
    gnd2pwr: [
      { id: 'min_power_ground_clearance', label: 'Minimum ground to power clearance', requiredFt: 18, requiredIn: 0 }
    ],
    bolt: [
      { id: 'min_supply_gap', label: 'Minimum separation to supply (40 in)', requiredFt: 3, requiredIn: 4 },
      { id: 'min_com_gap', label: 'Minimum separation between communications (12 in)', requiredFt: 1, requiredIn: 0 }
    ]
  };
  // Clearance calculators - Enhanced version
  function buildClearanceTool(type) {
    const rulesKey = `clearanceRules-${type}`;
    let rules = clearanceDefaults[type].map(r => ({ ...r }));
    
    // Load saved rules with enhanced error handling
    const savedRules = Storage.load(rulesKey, null);
    if (savedRules && Array.isArray(savedRules)) {
      rules = savedRules;
    }
    
    const container = document.createElement('div');
    const titles = {
      gnd2com: 'Ground to Communication Clearance',
      gnd2pwr: 'Ground to Power Clearance',
      bolt: 'Bolt Hole Clearance'
    };
    
    container.innerHTML = `
      <h2>${titles[type] || 'Clearance Calculator'}</h2>
      <div class="tool-section" id="clr-input-section">
        <h3>Measured Clearances</h3>
        <div style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">
          Enter your measured clearances for each requirement below:
        </div>
        <form id="clr-form"></form>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
          <button id="clr-calc" class="btn">Check Clearances</button>
          <button id="clr-clear" class="btn secondary">Clear All</button>
          <button id="clr-copy-results" class="btn secondary" disabled>Copy Results</button>
        </div>
      </div>
      
      <div class="tool-section" id="clr-results" style="display:none;">
        <h3>Clearance Check Results</h3>
        <div id="clr-summary" style="padding: 1rem; border-radius: var(--radius); margin: 0.5rem 0; font-weight: bold;"></div>
        <table class="clearance-table">
          <thead>
            <tr>
              <th>Clearance Requirement</th>
              <th>Required</th>
              <th>Measured</th>
              <th>Status</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody id="clr-table-body"></tbody>
        </table>
      </div>
      
      <div class="tool-section">
        <h3>Settings Management</h3>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="clr-import" class="btn secondary">Import Settings</button>
          <button id="clr-export" class="btn secondary">Export Settings</button>
          <button id="clr-reset" class="btn secondary">Reset to Defaults</button>
        </div>
        <input type="file" id="clr-file" accept="application/json" style="display:none;" />
      </div>
    `;
    
    toolContent.appendChild(container);
    
    const form = container.querySelector('#clr-form');
    const resultsSection = container.querySelector('#clr-results');
    const summaryEl = container.querySelector('#clr-summary');
    const tableBody = container.querySelector('#clr-table-body');
    const calcBtn = container.querySelector('#clr-calc');
    const clearBtn = container.querySelector('#clr-clear');
    const copyResultsBtn = container.querySelector('#clr-copy-results');
    const fileInput = container.querySelector('#clr-file');
    
    let lastResults = null;
    let allInputs = [];
    
    function renderForm() {
      form.innerHTML = '';
      allInputs = [];
      
      rules.forEach((rule, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'clr-input-group';
        wrapper.style.marginBottom = '1rem';
        wrapper.innerHTML = `
          <label style="display: block; margin-bottom: 0.25rem; font-weight: bold;">${rule.label}</label>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <input type="number" min="0" data-rule-index="${idx}" data-unit="ft" placeholder="0" 
                   style="flex: 1; min-width: 80px;" title="Feet" />
            <span style="color: #666;">ft</span>
            <input type="number" min="0" max="11" data-rule-index="${idx}" data-unit="in" placeholder="0" 
                   style="flex: 1; min-width: 80px;" title="Inches (0-11)" />
            <span style="color: #666;">in</span>
            <div style="margin-left: 0.5rem; font-size: 0.85rem; color: #666;">
              Required: ${rule.requiredFt}'-${rule.requiredIn}"
            </div>
          </div>
        `;
        form.appendChild(wrapper);
        
        // Add inputs to validation array
        const ftInput = wrapper.querySelector(`input[data-unit="ft"]`);
        const inInput = wrapper.querySelector(`input[data-unit="in"]`);
        allInputs.push(ftInput, inInput);
      });
      
      // Add input validation and Enter key navigation
      allInputs.forEach((input, idx) => {
        const isInches = input.dataset.unit === 'in';
        const maxVal = isInches ? 11 : null;
        
        input.addEventListener('input', () => {
          UI.validateInput(input, 0, maxVal);
          copyResultsBtn.disabled = true; // Disable copy until new calculation
        });
        
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (idx < allInputs.length - 1) {
              allInputs[idx + 1].focus();
            } else {
              checkClearances();
            }
          }
        });
      });
    }
    
    function checkClearances() {
      const hideLoading = UI.showLoading(calcBtn, 'Checking...');
      
      try {
        // Validate all inputs
        let hasErrors = false;
        allInputs.forEach(input => {
          const isInches = input.dataset.unit === 'in';
          const maxVal = isInches ? 11 : null;
          const isValid = UI.validateInput(input, 0, maxVal);
          if (!isValid) hasErrors = true;
        });
        
        if (hasErrors) {
          UI.showAlert('Please correct the highlighted input errors', 'error');
          return;
        }
        
        // Perform clearance checks
        tableBody.innerHTML = '';
        const results = [];
        let totalPassed = 0;
        let totalFailed = 0;
        
        rules.forEach((rule, idx) => {
          const ftInput = form.querySelector(`input[data-rule-index="${idx}"][data-unit="ft"]`);
          const inInput = form.querySelector(`input[data-rule-index="${idx}"][data-unit="in"]`);
          const mft = Validation.parseNumber(ftInput.value);
          const min = Validation.parseNumber(inInput.value);
          
          const measuredTotal = toTotalInches(mft, min);
          const requiredTotal = toTotalInches(rule.requiredFt, rule.requiredIn);
          const diff = measuredTotal - requiredTotal;
          const pass = diff >= 0;
          const diffObj = fromTotalInches(Math.abs(diff));
          
          if (pass) totalPassed++;
          else totalFailed++;
          
          const result = {
            rule: rule.label,
            required: `${rule.requiredFt}'-${rule.requiredIn}"`,
            measured: `${mft}'-${min}"`,
            pass: pass,
            margin: `${pass ? '+' : '-'}${diffObj.ft}'-${diffObj.in}"`
          };
          results.push(result);
          
          const tr = document.createElement('tr');
          tr.className = pass ? 'clearance-pass' : 'clearance-fail';
          tr.innerHTML = `
            <td>${rule.label}</td>
            <td>${rule.requiredFt}'-${rule.requiredIn}"</td>
            <td>${mft}'-${min}"</td>
            <td class="${pass ? 'pass' : 'fail'}">${pass ? 'PASS' : 'FAIL'}</td>
            <td>${pass ? '+' : '-'}${diffObj.ft}'-${diffObj.in}"</td>
          `;
          tableBody.appendChild(tr);
        });
        
        // Update summary
        const overallPass = totalFailed === 0;
        summaryEl.style.backgroundColor = overallPass ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
        summaryEl.style.color = overallPass ? 'var(--color-success)' : 'var(--color-error)';
        summaryEl.style.border = `2px solid ${overallPass ? 'var(--color-success)' : 'var(--color-error)'}`;
        summaryEl.innerHTML = `
          Overall Result: <span style="font-size: 1.3em;">${overallPass ? 'PASS' : 'FAIL'}</span><br>
          <span style="font-size: 0.9em;">
            ${totalPassed} passed, ${totalFailed} failed (${totalPassed + totalFailed} total checks)
          </span>
        `;
        
        // Store results for copying
        lastResults = {
          type: titles[type],
          overall: overallPass ? 'PASS' : 'FAIL',
          passed: totalPassed,
          failed: totalFailed,
          details: results
        };
        
        resultsSection.style.display = 'block';
        copyResultsBtn.disabled = false;
        
        const alertType = overallPass ? 'success' : 'error';
        const message = overallPass 
          ? `All clearances pass! (${totalPassed}/${totalPassed + totalFailed})`
          : `${totalFailed} clearance(s) failed! (${totalPassed}/${totalPassed + totalFailed} passed)`;
        UI.showAlert(message, alertType);
        
      } catch (error) {
        console.error('Clearance check error:', error);
        UI.showAlert('An error occurred during clearance checking', 'error');
      } finally {
        hideLoading();
      }
    }
    
    function clearAllInputs() {
      if (confirm('Are you sure you want to clear all measurements?')) {
        allInputs.forEach(input => {
          input.value = '';
          input.classList.remove('input-error', 'input-success');
        });
        resultsSection.style.display = 'none';
        copyResultsBtn.disabled = true;
        lastResults = null;
        UI.showAlert('All inputs cleared', 'success');
        if (allInputs.length > 0) allInputs[0].focus();
      }
    }
    
    function copyResults() {
      if (!lastResults) return;
      
      let resultText = `${lastResults.type} Results:
Overall Status: ${lastResults.overall}
Passed: ${lastResults.passed}, Failed: ${lastResults.failed}

Detailed Results:
`;
      
      lastResults.details.forEach(detail => {
        resultText += `\n${detail.rule}:
  Required: ${detail.required}
  Measured: ${detail.measured}
  Status: ${detail.pass ? 'PASS' : 'FAIL'}
  Margin: ${detail.margin}`;
      });
      
      UI.copyToClipboard(resultText, 'Clearance results copied!');
    }
    
    // Event listeners
    calcBtn.addEventListener('click', (e) => {
      e.preventDefault();
      checkClearances();
    });
    
    clearBtn.addEventListener('click', clearAllInputs);
    copyResultsBtn.addEventListener('click', copyResults);
    
    // Settings management with enhanced error handling
    container.querySelector('#clr-import').addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (Array.isArray(data) && data.length > 0) {
            rules = data;
            Storage.save(rulesKey, rules);
            renderForm();
            UI.showAlert('Settings imported successfully', 'success');
          } else {
            UI.showAlert('Invalid settings format - expected array of rules', 'error');
          }
        } catch (error) {
          UI.showAlert('Invalid JSON file format', 'error');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
    
    container.querySelector('#clr-export').addEventListener('click', () => {
      const settingsText = JSON.stringify(rules, null, 2);
      UI.copyToClipboard(settingsText, 'Settings exported to clipboard!');
    });
    
    container.querySelector('#clr-reset').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        rules = clearanceDefaults[type].map(r => ({ ...r }));
        Storage.remove(rulesKey);
        renderForm();
        UI.showAlert('Settings reset to defaults', 'success');
      }
    });
    
    // Initialize form
    renderForm();
    
    // Focus first input
    if (allInputs.length > 0) {
      allInputs[0].focus();
    }
  }
})();