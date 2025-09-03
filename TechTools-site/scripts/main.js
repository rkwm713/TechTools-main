// TechTools Main Application
// Coordinates all modules and initializes the application

(function() {
  'use strict';
  
  // Ensure all modules are available
  function checkDependencies() {
    const requiredModules = [
      'TechTools.UI',
      'TechTools.Storage', 
      'TechTools.Utils',
      'TechTools.SmartInput',
      'TechTools.Navigation'
    ];
    
    const missing = requiredModules.filter(module => {
      const parts = module.split('.');
      let obj = window;
      for (const part of parts) {
        if (!obj[part]) return true;
        obj = obj[part];
      }
      return false;
    });
    
    if (missing.length > 0) {
      console.error('Missing required modules:', missing);
      return false;
    }
    
    return true;
  }
  
  // Initialize application when DOM is ready
  function initializeApp() {
    try {
      // Check if all dependencies are loaded
      if (!checkDependencies()) {
        console.error('Cannot initialize - missing dependencies');
        return;
      }
      
      // Initialize navigation system
      window.TechTools.Navigation.initialize();
      
      // Create global aliases for backward compatibility
      window.UI = window.TechTools.UI;
      window.Storage = window.TechTools.Storage;
      window.SmartInput = window.TechTools.SmartInput;
      window.toTotalInches = window.TechTools.Utils.toTotalInches;
      window.fromTotalInches = window.TechTools.Utils.fromTotalInches;
      window.Validation = window.TechTools.Validation;
      
      // Wait for tool modules to register their builders
      setTimeout(() => {
        console.log('🚀 TechTools application initialized successfully');
        
        // Check OCR availability
        if (window.OCRSystem) {
          if (window.OCRSystem.available) {
            console.log('📷 OCR system available - screenshot processing enabled');
          } else {
            console.warn('📷 OCR system unavailable - manual entry only');
          }
        }
        
        // Show ready state
        const readyEvent = new CustomEvent('techtoolsReady', {
          detail: {
            version: '2.0.0',
            modules: Object.keys(window.TechTools),
            ocrAvailable: !!(window.OCRSystem && window.OCRSystem.available)
          }
        });
        document.dispatchEvent(readyEvent);
      }, 100);
      
    } catch (error) {
      console.error('Failed to initialize TechTools:', error);
      
      // Show error to user
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-width: 400px; text-align: center; z-index: 10000;
      `;
      errorDiv.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
        <h3 style="margin: 0 0 1rem 0; color: #dc3545;">Application Error</h3>
        <p style="margin: 0 0 1rem 0; color: #666;">
          TechTools failed to initialize properly. Please refresh the page or check the browser console for details.
        </p>
        <button onclick="location.reload()" style="background: #007acc; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
          Refresh Page
        </button>
      `;
      document.body.appendChild(errorDiv);
    }
  }
  
  // Wait for DOM and all scripts to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
  
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.TechTools && window.TechTools.UI) {
      window.TechTools.UI.showAlert('An unexpected error occurred. Please refresh the page if issues persist.', 'error');
    }
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.TechTools && window.TechTools.UI) {
      window.TechTools.UI.showAlert('An unexpected error occurred. Please refresh the page if issues persist.', 'error');
    }
  });
  
})();

console.log('🚀 TechTools Main application loader ready');
