// TechTools Productivity Tools
// Note editor and checklist management tools

window.TechTools = window.TechTools || {};

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
  window.TechTools.Navigation.toolContent.appendChild(container);
  
  const editor = container.querySelector('#note-editor');
  const copyTextBtn = container.querySelector('#note-copy-text');
  const copyHtmlBtn = container.querySelector('#note-copy-html');
  const clearBtn = container.querySelector('#note-clear');
  const statusSpan = container.querySelector('#note-status');
  const charCountSpan = container.querySelector('#note-char-count');
  const buttons = container.querySelectorAll('.note-toolbar button[data-command]');
  
  // Load saved content
  const saved = window.TechTools.Storage.load('quicNote', '');
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
      if (window.TechTools.Storage.save('quicNote', editor.innerHTML)) {
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
        window.TechTools.UI.showAlert(`Applied ${cmd} formatting`, 'success');
      } catch (error) {
        console.error('Formatting error:', error);
        window.TechTools.UI.showAlert('Failed to apply formatting', 'error');
      }
    });
  });
  
  // Copy functionality
  copyTextBtn.addEventListener('click', () => {
    const plainText = editor.innerText || editor.textContent;
    if (plainText.trim()) {
      window.TechTools.UI.copyToClipboard(plainText, 'Plain text copied to clipboard!');
    } else {
      window.TechTools.UI.showAlert('Note is empty', 'warning');
    }
  });
  
  copyHtmlBtn.addEventListener('click', () => {
    const htmlContent = editor.innerHTML;
    if (htmlContent.trim()) {
      window.TechTools.UI.copyToClipboard(htmlContent, 'HTML copied to clipboard!');
    } else {
      window.TechTools.UI.showAlert('Note is empty', 'warning');
    }
  });
  
  // Clear functionality
  clearBtn.addEventListener('click', () => {
    if (editor.innerHTML.trim() && confirm('Are you sure you want to clear the note?')) {
      editor.innerHTML = '';
      window.TechTools.Storage.save('quicNote', '');
      updateStatus();
      window.TechTools.UI.showAlert('Note cleared', 'success');
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
  window.TechTools.Navigation.toolContent.appendChild(container);
  
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
    window.TechTools.UI.showAlert('Template saved', 'success');
  });
  
  loadBtn.addEventListener('click', () => {
    const saved = localStorage.getItem(tplKey);
    if (saved) {
      templateArea.value = saved;
      window.TechTools.UI.showAlert('Template loaded', 'success');
    } else {
      window.TechTools.UI.showAlert('No saved template found', 'warning');
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
          window.TechTools.UI.showAlert('Template imported', 'success');
        }
      } catch {
        window.TechTools.UI.showAlert('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
  
  exportBtn.addEventListener('click', () => {
    const items = parseTemplate(templateArea.value);
    const json = JSON.stringify(items, null, 2);
    window.TechTools.UI.copyToClipboard(json, 'Checklist JSON copied to clipboard!');
  });
  
  startBtn.addEventListener('click', () => {
    const items = parseTemplate(templateArea.value);
    if (!items.length) {
      window.TechTools.UI.showAlert('Please enter a template to start', 'warning');
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
      window.TechTools.UI.copyToClipboard(lines.join('\n'), 'Checklist copied as text!');
    };
    
    copyJsonBtn.onclick = () => {
      const json = JSON.stringify(items, null, 2);
      window.TechTools.UI.copyToClipboard(json, 'Checklist copied as JSON!');
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

// Register productivity tools with navigation system
document.addEventListener('DOMContentLoaded', () => {
  if (window.TechTools.Navigation) {
    window.TechTools.Navigation.registerTool('quic-note', buildNotePad);
    window.TechTools.Navigation.registerTool('qc-checklist', buildChecklistTool);
    console.log('📝 Productivity tools registered');
  }
});

console.log('📝 TechTools Productivity tools loaded');
