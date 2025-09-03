// TechTools Smart Input System
// Advanced measurement input parser supporting multiple formats with real-time validation

window.TechTools = window.TechTools || {};

// Smart Input System for Measurements
window.TechTools.SmartInput = {
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

// Legacy validation helpers (for backward compatibility)
window.TechTools.Validation = {
  parseNumber(value, defaultValue = 0) {
    return window.TechTools.Utils.parseNumber(value, defaultValue);
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

console.log('📐 TechTools Smart Input system loaded');
