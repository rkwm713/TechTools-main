// TechTools Core Utilities
// Basic utility functions for UI management, storage, and common operations

window.TechTools = window.TechTools || {};

// Enhanced error handling and user feedback
window.TechTools.UI = {
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
window.TechTools.Storage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      window.TechTools.UI.showAlert('Failed to save data', 'error');
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

// Common measurement utilities
window.TechTools.Utils = {
  toTotalInches(ft, inches) {
    const f = Number.isFinite(ft) ? ft : 0;
    const i = Number.isFinite(inches) ? inches : 0;
    return f * 12 + i;
  },
  
  fromTotalInches(total) {
    const sign = total < 0 ? -1 : 1;
    const abs = Math.abs(total);
    const ft = Math.floor(abs / 12);
    const inches = abs % 12;
    return { ft: ft * sign, in: inches };
  },
  
  parseNumber(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
};

console.log('📦 TechTools Core utilities loaded');
