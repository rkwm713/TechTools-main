// TechTools Calculator Tools
// Feet & Inches Calculator and Sag Calculator implementations

window.TechTools = window.TechTools || {};

// Feet & Inches Calculator - Enhanced with Smart Inputs
function buildFiCalculator() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tool-section">
      <!-- Compact input layout -->
      <div style="background: white; border-radius: var(--radius); padding: 0.75rem; box-shadow: var(--shadow); margin-bottom: 0.75rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div class="measurement-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">High Measurement</label>
          <div id="fi-high-wrapper"></div>
        </div>
        <div class="measurement-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">Low Measurement</label>
          <div id="fi-low-wrapper"></div>
        </div>
      </div>
      
        <div style="margin-bottom: 0.75rem;">
          <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; display: block;">Operation</label>
          <div style="display: flex; gap: 0.5rem;">
            <button id="fi-subtract-btn" class="btn secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem; flex: 1;">Subtract (High - Low)</button>
            <button id="fi-add-btn" class="btn secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem; flex: 1;">Add (High + Low)</button>
          </div>
        </div>
        
        <div style="display: flex; gap: 0.5rem; justify-content: center;">
          <button id="fi-calc-btn" class="btn" style="font-size: 0.9rem; padding: 0.5rem 1rem;">Calculate</button>
          <button id="fi-clear-btn" class="btn secondary" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">Clear History</button>
          <button id="fi-copy-result" class="btn secondary" disabled style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">Copy Last</button>
        </div>
    </div>
    </div>
    
    <!-- Most Recent Result Card -->
    <div class="tool-section" id="recent-result-section" style="display: none;">
      <div style="margin-bottom: 0.75rem;">
        <h4 style="margin: 0; font-size: 0.9rem; color: var(--color-primary);">Latest Result</h4>
      </div>
      <div id="recent-result-card" style="background: white; border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;"></div>
    </div>
    
    <div class="tool-section">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
        <h4 style="margin: 0; font-size: 0.9rem; color: var(--color-primary);">Previous Calculations</h4>
        <div style="font-size: 0.75rem; color: #666;" id="history-count"></div>
      </div>
      <div id="fi-results" style="background: white; border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;"></div>
    </div>
  `;
  window.TechTools.Navigation.toolContent.appendChild(container);
  
  // Create smart inputs
  const highInput = window.TechTools.SmartInput.createSmartInput('25-11', 'High measurement');
  const lowInput = window.TechTools.SmartInput.createSmartInput('25-11', 'Low measurement');
  
  container.querySelector('#fi-high-wrapper').appendChild(highInput.wrapper);
  container.querySelector('#fi-low-wrapper').appendChild(lowInput.wrapper);
  
  const subtractBtn = container.querySelector('#fi-subtract-btn');
  const addBtn = container.querySelector('#fi-add-btn');
  const resultsList = container.querySelector('#fi-results');
  const historyCount = container.querySelector('#history-count');
  const recentResultSection = container.querySelector('#recent-result-section');
  const recentResultCard = container.querySelector('#recent-result-card');
  const calcBtn = container.querySelector('#fi-calc-btn');
  const clearBtn = container.querySelector('#fi-clear-btn');
  const copyResultBtn = container.querySelector('#fi-copy-result');
  const historyKey = 'fiHistory';
  
  let currentOperation = 'subtract'; // Default to subtraction
  
  let history = window.TechTools.Storage.load(historyKey, []);
  let lastResult = null;
  
  // Function to update operation button states
  function updateOperationButtons() {
    if (currentOperation === 'subtract') {
      subtractBtn.className = 'btn';
      addBtn.className = 'btn secondary';
    } else {
      subtractBtn.className = 'btn secondary';
      addBtn.className = 'btn';
    }
  }
  
  // Set default operation highlighting
  updateOperationButtons();
  
  // Operation button event handlers
  subtractBtn.addEventListener('click', () => {
    currentOperation = 'subtract';
    updateOperationButtons();
  });
  
  addBtn.addEventListener('click', () => {
    currentOperation = 'add';
    updateOperationButtons();
  });
  
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
      } else if (e.key === 'Tab' && e.shiftKey) {
        // Shift+Tab to toggle operation
        e.preventDefault();
        currentOperation = currentOperation === 'subtract' ? 'add' : 'subtract';
        updateOperationButtons();
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
    const previousCalculations = history.slice(1); // Exclude most recent
    historyCount.textContent = previousCalculations.length === 0 ? '' : `${previousCalculations.length} previous`;
    
    // Handle most recent result card
    if (history.length > 0) {
      const mostRecent = history[0];
      const operationType = mostRecent.operation.includes('+') ? 'ADD' : 'SUB';
      const operationColor = operationType === 'ADD' ? 'var(--color-success)' : 'var(--color-primary)';
      const operationBg = operationType === 'ADD' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(0, 123, 255, 0.1)';
      
      recentResultCard.innerHTML = `
        <div style="padding: 1rem; cursor: pointer; transition: background-color 0.2s;" 
             onmouseover="this.style.backgroundColor='#f8f9fa'" 
             onmouseout="this.style.backgroundColor=''"
             onclick="window.TechTools.UI.copyToClipboard('${mostRecent.display}', 'Result copied!')">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 1.4rem; font-weight: 700; color: var(--color-primary); margin-bottom: 0.25rem;">${mostRecent.display}</div>
              <div style="font-size: 0.8rem; color: #666;">${mostRecent.operation}</div>
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 0.25rem;">
                <span style="padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; background: ${operationBg}; color: ${operationColor};">
                  ${operationType}
                </span>
              </div>
              <div style="font-size: 0.75rem; color: #666;">${Math.abs(mostRecent.totalInches)}" total</div>
            </div>
          </div>
        </div>
      `;
      recentResultSection.style.display = 'block';
    } else {
      recentResultSection.style.display = 'none';
    }
    
    // Handle previous calculations table
    if (previousCalculations.length === 0) {
      resultsList.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: #666; font-style: italic;">
          <div style="font-size: 0.9rem;">No previous calculations</div>
          <div style="font-size: 0.75rem; margin-top: 0.25rem;">${history.length === 0 ? 'Enter measurements and click Calculate to start' : 'Perform more calculations to build history'}</div>
        </div>
      `;
      return;
    }
    
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e9ecef;">
            <th style="font-size: 0.7rem; padding: 0.5rem; text-align: left; text-transform: uppercase; color: var(--color-primary); font-weight: 600;">Result</th>
            <th style="font-size: 0.7rem; padding: 0.5rem; text-align: center; text-transform: uppercase; color: var(--color-primary); font-weight: 600;">Operation</th>
            <th style="font-size: 0.7rem; padding: 0.5rem; text-align: center; text-transform: uppercase; color: var(--color-primary); font-weight: 600;">Time</th>
            <th style="font-size: 0.7rem; padding: 0.5rem; text-align: right; text-transform: uppercase; color: var(--color-primary); font-weight: 600;">Total Inches</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    previousCalculations.forEach((entry, idx) => {
      const operationType = entry.operation.includes('+') ? 'ADD' : 'SUB';
      const operationColor = operationType === 'ADD' ? 'var(--color-success)' : 'var(--color-primary)';
      const operationBg = operationType === 'ADD' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(0, 123, 255, 0.1)';
      
      tableHTML += `
        <tr style="border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background-color 0.2s;" 
            class="history-row"
            onmouseover="this.style.backgroundColor='#f8f9fa'" 
            onmouseout="this.style.backgroundColor=''"
            onclick="window.TechTools.UI.copyToClipboard('${entry.display}', 'Result copied!')">
          <td style="padding: 0.75rem 0.5rem;">
            <div style="font-weight: 700; font-size: 0.9rem; color: var(--color-primary);">${entry.display}</div>
            <div style="font-size: 0.7rem; color: #666; margin-top: 0.1rem;">${entry.operation}</div>
          </td>
          <td style="padding: 0.75rem 0.5rem; text-align: center;">
            <span style="padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: ${operationBg}; color: ${operationColor};">
              ${operationType}
            </span>
          </td>
          <td style="padding: 0.75rem 0.5rem; text-align: center; font-size: 0.75rem; color: #666;">
            ${entry.timestamp || 'Recent'}
          </td>
          <td style="padding: 0.75rem 0.5rem; text-align: right; font-size: 0.8rem; font-weight: 600; color: #666;">
            ${Math.abs(entry.totalInches)}"
          </td>
        </tr>
      `;
    });
    
    tableHTML += `
        </tbody>
      </table>
    `;
    
    resultsList.innerHTML = tableHTML;
  }
  
  function compute() {
    const hideLoading = window.TechTools.UI.showLoading(calcBtn, 'Calculating...');
    
    try {
      // Get smart input values
      const highResult = window.TechTools.SmartInput.getValue(highInput.input);
      const lowResult = window.TechTools.SmartInput.getValue(lowInput.input);
      
      // Validate inputs
      if (!highResult.isValid) {
        window.TechTools.UI.showAlert(`High measurement error: ${highResult.error}`, 'error');
        highInput.input.focus();
        hideLoading();
        return;
      }
      
      if (!lowResult.isValid) {
        window.TechTools.UI.showAlert(`Low measurement error: ${lowResult.error}`, 'error');
        lowInput.input.focus();
        hideLoading();
        return;
      }
      
      // Perform calculation
      const resultTotal = currentOperation === 'subtract' 
        ? highResult.totalInches - lowResult.totalInches 
        : highResult.totalInches + lowResult.totalInches;
      
      const { ft: rft, in: rin } = window.TechTools.Utils.fromTotalInches(resultTotal);
      const display = `${rft}'-${rin}"`;
      
      const operationText = currentOperation === 'subtract' 
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
      
      window.TechTools.Storage.save(historyKey, history);
      updateHistoryList();
      
      // Enhanced success feedback
      const operationVerb = currentOperation === 'subtract' ? 'Subtracted' : 'Added';
      window.TechTools.UI.showAlert(`${operationVerb}: ${display}`, 'success');
      
    } catch (error) {
      console.error('Calculation error:', error);
      window.TechTools.UI.showAlert('An error occurred during calculation', 'error');
    } finally {
      hideLoading();
    }
  }
  
  function copyLastResult() {
    if (lastResult) {
      window.TechTools.UI.copyToClipboard(lastResult.display, 'Last result copied!');
    }
  }
  

  
  calcBtn.addEventListener('click', compute);
  
  clearBtn.addEventListener('click', () => {
    if (history.length === 0) {
      window.TechTools.UI.showAlert('No history to clear', 'info');
      return;
    }
    
    if (confirm(`Clear all ${history.length} calculation${history.length !== 1 ? 's' : ''}?`)) {
      const clearedCount = history.length;
      history = [];
      lastResult = null;
      copyResultBtn.disabled = true;
      recentResultSection.style.display = 'none';
      window.TechTools.Storage.save(historyKey, history);
      updateHistoryList();
      window.TechTools.UI.showAlert(`Cleared ${clearedCount} calculation${clearedCount !== 1 ? 's' : ''}`, 'success');
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

// Sag calculator - Enhanced with Smart Inputs and Reference Table
function buildSagCalculator() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tool-section">
      <div style="margin-bottom: 1rem;">
        <h3 style="margin: 0; font-size: 1rem;">Sag Calculation</h3>
      </div>
      
      <!-- Compact input layout -->
      <div style="background: white; border-radius: var(--radius); padding: 0.75rem; box-shadow: var(--shadow); margin-bottom: 0.75rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div class="measurement-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">Neutral 1</label>
          <div id="sag-n1-wrapper"></div>
        </div>
        <div class="measurement-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">Neutral 2</label>
          <div id="sag-n2-wrapper"></div>
        </div>
        <div class="measurement-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">Neutral Midspan</label>
          <div id="sag-nmid-wrapper"></div>
        </div>
      </div>
      
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
        <div class="measurement-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: #7b1fa2;">Fiber 1</label>
          <div id="sag-f1-wrapper"></div>
        </div>
        <div class="measurement-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: #7b1fa2;">Fiber 2</label>
          <div id="sag-f2-wrapper"></div>
        </div>
          <div style="display: flex; align-items: end; justify-content: center;">
            <div style="display: flex; gap: 0.5rem;">
              <button id="sag-calc" class="btn" style="font-size: 0.9rem; padding: 0.5rem 1rem;">Calculate</button>
              <button id="sag-clear" class="btn secondary" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">Clear</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="tool-section" id="sag-results" style="display:none;">
      <div id="sag-summary" style="padding: 0.75rem; border-radius: var(--radius); font-weight: 600; font-size: 0.95rem; margin-bottom: 0.75rem;"></div>
      
      <div style="background: white; border-radius: var(--radius); padding: 0.75rem; box-shadow: var(--shadow); margin-bottom: 0.75rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; text-align: center; font-size: 0.85rem;">
          <div>
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Neutral Average</div>
            <div id="neutral-avg" style="font-size: 1rem; font-weight: 600; color: var(--color-primary);"></div>
          </div>
          <div style="border-left: 1px solid #eee; border-right: 1px solid #eee;">
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Sag Factor</div>
            <div id="sag-factor-display" style="font-size: 1rem; font-weight: 600; color: var(--color-accent);"></div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Result</div>
            <div id="sag-result-display" style="font-size: 1.1rem; font-weight: 700; color: var(--color-success);"></div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1rem;">
        <button id="sag-copy" class="btn secondary" disabled style="font-size: 0.8rem; padding: 0.5rem 0.75rem;">Copy Results</button>
        <button id="show-table" class="btn secondary" style="font-size: 0.8rem; padding: 0.5rem 0.75rem;">Show Reference Table</button>
      </div>
    </div>
    
    <!-- Sag Reference Table -->
    <div class="tool-section" id="sag-reference-table" style="display: none;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
        <h4 style="margin: 0; font-size: 0.9rem; color: var(--color-primary);">Sag Calculation Reference</h4>
        <button id="hide-table" class="btn secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">Hide</button>
      </div>
      
      <div style="background: #fff8e1; border-left: 3px solid var(--color-warning); padding: 0.5rem; margin: 0.5rem 0; border-radius: 0 var(--radius) var(--radius) 0;">
        <div style="font-weight: 600; color: #e65100; font-size: 0.8rem;">Engineering Reference</div>
        <div style="font-size: 0.75rem; color: #bf360c; line-height: 1.2;">
          Use this table for reference only. Always consult current NESC standards and local utility specifications.
        </div>
      </div>
      
      <div style="overflow-x: auto;">
        <table class="clearance-table ultra-compact" style="margin-bottom: 0.5rem;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="font-size: 0.7rem; padding: 0.3rem; text-transform: uppercase; color: var(--color-primary);">Category</th>
              <th style="font-size: 0.7rem; padding: 0.3rem; text-align: center;">Specification</th>
              <th style="font-size: 0.7rem; padding: 0.3rem; text-align: center;">Typical Value</th>
              <th style="font-size: 0.7rem; padding: 0.3rem;">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid var(--color-primary);">NESC Rule 235C</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">Minimum separation at support</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: var(--color-success);">40"</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">Power to communication conductors</td>
            </tr>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid var(--color-accent);">Typical Sag Factor</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">Support avg ÷ midspan sag</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: var(--color-accent);">0.8 - 1.2</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">Varies with span length and tension</td>
            </tr>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid #7b1fa2;">Fiber Optic Cable</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">ADSS typical sag</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: #7b1fa2;">1.5% - 3%</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">Of span length at initial conditions</td>
            </tr>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid var(--color-warning);">200' Span</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">Typical fiber sag</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: var(--color-warning);">3' - 6'</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">Standard distribution span</td>
            </tr>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid var(--color-warning);">300' Span</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">Typical fiber sag</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: var(--color-warning);">4.5' - 9'</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">Longer distribution span</td>
            </tr>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid var(--color-error);">Temperature</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">Sag increases with heat</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: var(--color-error);">+15% - 25%</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">From initial to maximum operating temp</td>
            </tr>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid #666;">Ice Loading</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">Heavy ice conditions</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: #666;">+10% - 20%</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">NESC Heavy loading district</td>
            </tr>
            <tr>
              <td style="font-size: 0.75rem; padding: 0.4rem; font-weight: 600; border-left: 3px solid var(--color-success);">Safety Margin</td>
              <td style="font-size: 0.75rem; padding: 0.4rem;">Recommended clearance buffer</td>
              <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: var(--color-success);">6" - 12"</td>
              <td style="font-size: 0.75rem; padding: 0.4rem; color: #666;">Above minimum NESC requirements</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  window.TechTools.Navigation.toolContent.appendChild(container);
  
  // Create smart inputs
  const smartInputs = {
    n1: window.TechTools.SmartInput.createSmartInput('25-11', 'Neutral 1'),
    n2: window.TechTools.SmartInput.createSmartInput('25-11', 'Neutral 2'), 
    nmid: window.TechTools.SmartInput.createSmartInput('25-11', 'Neutral Midspan'),
    f1: window.TechTools.SmartInput.createSmartInput('25-11', 'Fiber 1'),
    f2: window.TechTools.SmartInput.createSmartInput('25-11', 'Fiber 2')
  };
  
  // Append smart inputs to their wrappers
  container.querySelector('#sag-n1-wrapper').appendChild(smartInputs.n1.wrapper);
  container.querySelector('#sag-n2-wrapper').appendChild(smartInputs.n2.wrapper);
  container.querySelector('#sag-nmid-wrapper').appendChild(smartInputs.nmid.wrapper);
  container.querySelector('#sag-f1-wrapper').appendChild(smartInputs.f1.wrapper);
  container.querySelector('#sag-f2-wrapper').appendChild(smartInputs.f2.wrapper);
  
  const resultsSection = container.querySelector('#sag-results');
  const summaryEl = container.querySelector('#sag-summary');
  const neutralAvgEl = container.querySelector('#neutral-avg');
  const sagFactorDisplayEl = container.querySelector('#sag-factor-display');
  const sagResultDisplayEl = container.querySelector('#sag-result-display');
  const calcBtn = container.querySelector('#sag-calc');
  const clearBtn = container.querySelector('#sag-clear');
  const copyBtn = container.querySelector('#sag-copy');
  const showTableBtn = container.querySelector('#show-table');
  const hideTableBtn = container.querySelector('#hide-table');
  const referenceTableSection = container.querySelector('#sag-reference-table');
  
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
    const hideLoading = window.TechTools.UI.showLoading(calcBtn, 'Calculating...');
    
    try {
      // Get smart input values
      const values = {
        n1: window.TechTools.SmartInput.getValue(smartInputs.n1.input),
        n2: window.TechTools.SmartInput.getValue(smartInputs.n2.input),
        nmid: window.TechTools.SmartInput.getValue(smartInputs.nmid.input),
        f1: window.TechTools.SmartInput.getValue(smartInputs.f1.input),
        f2: window.TechTools.SmartInput.getValue(smartInputs.f2.input)
      };
      
      // Validate all inputs
      for (const [key, result] of Object.entries(values)) {
        if (!result.isValid) {
          window.TechTools.UI.showAlert(`${key.toUpperCase()} measurement error: ${result.error}`, 'error');
          smartInputs[key].input.focus();
          hideLoading();
          return;
        }
      }
      
      // Validate critical measurements
      if (values.nmid.totalInches <= 0) {
        window.TechTools.UI.showAlert('Neutral midspan must be greater than zero', 'error');
        smartInputs.nmid.input.focus();
        hideLoading();
        return;
      }
      
      // Validate that fiber measurements are provided
      if (values.f1.totalInches <= 0 || values.f2.totalInches <= 0) {
        window.TechTools.UI.showAlert('Both fiber measurements must be greater than zero', 'error');
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
      
      // Display results with enhanced styling
      const isReasonable = sagFactor >= 0.5 && sagFactor <= 2.0;
      summaryEl.style.cssText = `
        padding: 0.75rem; border-radius: var(--radius); font-weight: 600; font-size: 0.95rem; margin-bottom: 0.75rem;
        background-color: ${isReasonable ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)'};
        color: ${isReasonable ? 'var(--color-success)' : 'var(--color-warning)'};
        border: 1px solid ${isReasonable ? 'var(--color-success)' : 'var(--color-warning)'};
      `;
      
      summaryEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="margin-bottom: 0.15rem;">FIBER MIDSPAN SAG</div>
            <div style="font-size: 0.8rem; opacity: 0.8; font-weight: normal;">
              ${isReasonable ? 'Calculation within typical range' : 'Review: Unusual sag factor detected'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.3rem; font-weight: 700;">${lastResults.fiberSag}</div>
            <div style="font-size: 0.75rem; opacity: 0.8; font-weight: normal;">
              Factor: ${sagFactor.toFixed(3)}
            </div>
          </div>
        </div>
      `;
      
      neutralAvgEl.textContent = `${neutralAvg.toFixed(2)} ft`;
      sagFactorDisplayEl.textContent = sagFactor.toFixed(3);
      sagResultDisplayEl.textContent = lastResults.fiberSag;
      
      resultsSection.style.display = 'block';
      copyBtn.disabled = false;
      
      window.TechTools.UI.showAlert(`Calculation complete! Fiber sag: ${lastResults.fiberSag}`, 'success');
      
    } catch (error) {
      console.error('Sag calculation error:', error);
      window.TechTools.UI.showAlert('An error occurred during sag calculation', 'error');
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
      window.TechTools.UI.showAlert('All inputs cleared', 'success');
      smartInputs.n1.input.focus();
    }
  }
  
  function copyResults() {
    if (!lastResults) return;
    
    const resultText = `SAG CALCULATION RESULTS
  Neutral 1: ${lastResults.calculations.n1}
  Neutral 2: ${lastResults.calculations.n2}  
  Neutral Midspan: ${lastResults.calculations.nmid}
  Fiber 1: ${lastResults.calculations.f1}
  Fiber 2: ${lastResults.calculations.f2}
  
CALCULATION:
Neutral Average: ${lastResults.neutralAvg.toFixed(2)} ft
Fiber Average: ${lastResults.fiberAvg.toFixed(2)} ft
  Sag Factor: ${lastResults.sagFactor.toFixed(3)}

RESULT: ${lastResults.fiberSag}

REFERENCE GUIDELINES:
• NESC Rule 235C: 40" minimum separation at support
• Typical sag factor range: 0.8 - 1.2
• ADSS fiber typical sag: 1.5% - 3% of span length
• Temperature increases sag by 15% - 25%
• Consider 6" - 12" safety margin above NESC minimums`;
    
    window.TechTools.UI.copyToClipboard(resultText, 'Sag calculation results with reference data copied!');
  }
  
  function toggleTable(show) {
    referenceTableSection.style.display = show ? 'block' : 'none';
    if (show && referenceTableSection.scrollIntoView) {
      setTimeout(() => referenceTableSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }
  
  calcBtn.addEventListener('click', calculate);
  clearBtn.addEventListener('click', clearAll);
  copyBtn.addEventListener('click', copyResults);
  showTableBtn.addEventListener('click', () => toggleTable(true));
  hideTableBtn.addEventListener('click', () => toggleTable(false));
  
  // Focus first input on load
  smartInputs.n1.input.focus();
}

// Register calculator tools with navigation system
document.addEventListener('DOMContentLoaded', () => {
  if (window.TechTools.Navigation) {
    window.TechTools.Navigation.registerTool('fi-calculator', buildFiCalculator);
    window.TechTools.Navigation.registerTool('sag-calculator', buildSagCalculator);
    console.log('🧮 Calculator tools registered');
  }
});

console.log('🧮 TechTools Calculator tools loaded');
