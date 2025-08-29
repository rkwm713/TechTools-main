// TechTools Web script
//
// This file powers the TechTools website. It mirrors the logic of the
// Chrome extension, providing a suite of calculators, a notes
// editor, a checklist manager and clearance checkers. Data is
// persisted using localStorage.

(function () {
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

  // Feet & Inches Calculator
  function buildFiCalculator() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h2>Feet & Inches Calculator</h2>
      <div class="tool-section">
        <label for="fi-high-ft">High measurement (feet)</label>
        <input type="number" id="fi-high-ft" min="0" />
        <label for="fi-high-in">High measurement (inches)</label>
        <input type="number" id="fi-high-in" min="0" max="11" />
        <label for="fi-low-ft">Low measurement (feet)</label>
        <input type="number" id="fi-low-ft" min="0" />
        <label for="fi-low-in">Low measurement (inches)</label>
        <input type="number" id="fi-low-in" min="0" max="11" />
        <label for="fi-operation">Operation</label>
        <select id="fi-operation">
          <option value="subtract">Subtract</option>
          <option value="add">Add</option>
        </select>
      </div>
      <div class="tool-section">
        <button id="fi-calc-btn" class="btn">Calculate</button>
        <button id="fi-clear-btn" class="btn secondary">Clear History</button>
      </div>
      <ul id="fi-results" class="results-list"></ul>
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
    let history = [];
    try {
      const stored = localStorage.getItem(historyKey);
      if (stored) history = JSON.parse(stored);
    } catch {}
    function updateHistoryList() {
      resultsList.innerHTML = '';
      history.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = `${entry.display} (${entry.totalInches} in)`;
        li.title = 'Click to copy formatted value';
        li.addEventListener('click', () => {
          navigator.clipboard.writeText(entry.display);
        });
        resultsList.appendChild(li);
      });
    }
    function saveHistory() {
      localStorage.setItem(historyKey, JSON.stringify(history));
    }
    function compute() {
      const values = inputs.map((input) => parseInt(input.value, 10));
      const [hf, hi, lf, li] = values.map((v) => (isNaN(v) ? 0 : v));
      const highTotal = toTotalInches(hf, hi);
      const lowTotal = toTotalInches(lf, li);
      const resultTotal = opSelect.value === 'subtract' ? highTotal - lowTotal : highTotal + lowTotal;
      const { ft: rft, in: rin } = fromTotalInches(resultTotal);
      const display = `${rft}’-${rin}”`;
      history.push({ display, totalInches: resultTotal });
      if (history.length > 4) history.shift();
      saveHistory();
      updateHistoryList();
    }
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
    calcBtn.addEventListener('click', compute);
    clearBtn.addEventListener('click', () => {
      history = [];
      saveHistory();
      updateHistoryList();
    });
    updateHistoryList();
  }

  // Note editor
  function buildNotePad() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h2>QuiC Note</h2>
      <div class="note-toolbar">
        <button data-command="bold" title="Bold"><strong>B</strong></button>
        <button data-command="italic" title="Italic"><em>I</em></button>
        <button data-command="underline" title="Underline"><u>U</u></button>
        <button data-command="insertUnorderedList" title="Bulleted list">• List</button>
        <button data-command="insertOrderedList" title="Numbered list">1. List</button>
        <button id="note-copy" title="Copy note">Copy</button>
      </div>
      <div id="note-editor" class="note-editor" contenteditable="true"></div>
    `;
    toolContent.appendChild(container);
    const editor = container.querySelector('#note-editor');
    const copyBtn = container.querySelector('#note-copy');
    const buttons = container.querySelectorAll('.note-toolbar button[data-command]');
    const saved = localStorage.getItem('quicNote');
    if (saved) editor.innerHTML = saved;
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.command;
        document.execCommand(cmd, false, null);
        editor.focus();
      });
    });
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(editor.innerText);
    });
    editor.addEventListener('input', () => {
      localStorage.setItem('quicNote', editor.innerHTML);
    });
  }

  // Sag calculator
  function buildSagCalculator() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h2>Sag Calculator</h2>
      <div class="tool-section">
        <h3>Inputs</h3>
        <label>Neutral 1 (ft)</label>
        <input type="number" id="sag-n1-ft" />
        <label>Neutral 1 (in)</label>
        <input type="number" id="sag-n1-in" />
        <label>Neutral 2 (ft)</label>
        <input type="number" id="sag-n2-ft" />
        <label>Neutral 2 (in)</label>
        <input type="number" id="sag-n2-in" />
        <label>Neutral Midspan (ft)</label>
        <input type="number" id="sag-nmid-ft" />
        <label>Neutral Midspan (in)</label>
        <input type="number" id="sag-nmid-in" />
        <label>Proposed Fiber 1 (ft)</label>
        <input type="number" id="sag-f1-ft" />
        <label>Proposed Fiber 1 (in)</label>
        <input type="number" id="sag-f1-in" />
        <label>Proposed Fiber 2 (ft)</label>
        <input type="number" id="sag-f2-ft" />
        <label>Proposed Fiber 2 (in)</label>
        <input type="number" id="sag-f2-in" />
        <button id="sag-calc" class="btn">Calculate</button>
      </div>
      <div class="tool-section" id="sag-results" style="display:none;">
        <h3>Results</h3>
        <p id="sag-factor"></p>
        <p id="sag-fiber"></p>
      </div>
    `;
    toolContent.appendChild(container);
    const ids = ['n1-ft','n1-in','n2-ft','n2-in','nmid-ft','nmid-in','f1-ft','f1-in','f2-ft','f2-in'];
    const inputs = {};
    ids.forEach(id => {
      inputs[id.replace('-', '')] = container.querySelector(`#sag-${id}`);
    });
    const results = container.querySelector('#sag-results');
    const factorEl = container.querySelector('#sag-factor');
    const fiberEl = container.querySelector('#sag-fiber');
    container.querySelector('#sag-calc').addEventListener('click', () => {
      const n1Dec = toTotalInches(parseInt(inputs.n1ft.value, 10), parseInt(inputs.n1in.value, 10)) / 12;
      const n2Dec = toTotalInches(parseInt(inputs.n2ft.value, 10), parseInt(inputs.n2in.value, 10)) / 12;
      const nmidDec = toTotalInches(parseInt(inputs.nmidft.value, 10), parseInt(inputs.nmidin.value, 10)) / 12;
      const f1Dec = toTotalInches(parseInt(inputs.f1ft.value, 10), parseInt(inputs.f1in.value, 10)) / 12;
      const f2Dec = toTotalInches(parseInt(inputs.f2ft.value, 10), parseInt(inputs.f2in.value, 10)) / 12;
      if (!nmidDec) {
        factorEl.textContent = 'Please enter valid Neutral Midspan.';
        fiberEl.textContent = '';
        results.style.display = 'block';
        return;
      }
      const neutralAvg = (n1Dec + n2Dec) / 2;
      const sagFactor = neutralAvg / nmidDec;
      const fiberAvg = (f1Dec + f2Dec) / 2;
      const fiberSag = fiberAvg / sagFactor;
      const sagFt = Math.floor(fiberSag);
      const sagIn = (fiberSag - sagFt) * 12;
      const sagInRounded = Math.round(sagIn);
      let finalFt = sagFt;
      let finalIn = sagInRounded;
      if (sagInRounded === 12) {
        finalFt += 1;
        finalIn = 0;
      }
      factorEl.textContent = `Sag Factor: ${sagFactor.toFixed(3)}`;
      fiberEl.textContent = `Fiber Midpoint: ${finalFt}’-${finalIn}”`;
      results.style.display = 'block';
    });
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
  function buildClearanceTool(type) {
    const rulesKey = `clearanceRules-${type}`;
    let rules = clearanceDefaults[type].map(r => ({ ...r }));
    try {
      const saved = localStorage.getItem(rulesKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) rules = parsed;
      }
    } catch {}
    const container = document.createElement('div');
    const titles = {
      gnd2com: 'Ground to Communication Clearance',
      gnd2pwr: 'Ground to Power Clearance',
      bolt: 'Bolt Hole Clearance'
    };
    container.innerHTML = `
      <h2>${titles[type] || 'Clearance Calculator'}</h2>
      <div class="tool-section" id="clr-input-section">
        <p>Enter measured clearances below:</p>
        <form id="clr-form"></form>
        <button id="clr-calc" class="btn">Check Clearances</button>
      </div>
      <div class="tool-section" id="clr-results" style="display:none;">
        <h3>Results</h3>
        <table class="clearance-table">
          <thead>
            <tr><th>Clearance Type</th><th>Required</th><th>Measured</th><th>Pass/Fail</th><th>Difference</th></tr>
          </thead>
          <tbody id="clr-table-body"></tbody>
        </table>
      </div>
      <div class="tool-section">
        <h3>Settings</h3>
        <button id="clr-import" class="btn secondary">Import Settings</button>
        <button id="clr-export" class="btn secondary">Export Settings</button>
        <button id="clr-reset" class="btn secondary">Reset Defaults</button>
        <input type="file" id="clr-file" accept="application/json" style="display:none;" />
      </div>
    `;
    toolContent.appendChild(container);
    const form = container.querySelector('#clr-form');
    const resultsSection = container.querySelector('#clr-results');
    const tableBody = container.querySelector('#clr-table-body');
    function renderForm() {
      form.innerHTML = '';
      rules.forEach((rule, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'clr-input-group';
        wrapper.innerHTML = `
          <label>${rule.label}</label>
          <div style="display:flex; gap:0.5rem;">
            <input type="number" min="0" data-rule-index="${idx}" data-unit="ft" placeholder="ft" style="flex:1;" />
            <input type="number" min="0" max="11" data-rule-index="${idx}" data-unit="in" placeholder="in" style="flex:1;" />
          </div>
        `;
        form.appendChild(wrapper);
      });
    }
    renderForm();
    container.querySelector('#clr-calc').addEventListener('click', (e) => {
      e.preventDefault();
      tableBody.innerHTML = '';
      rules.forEach((rule, idx) => {
        const ftInput = form.querySelector(`input[data-rule-index="${idx}"][data-unit="ft"]`);
        const inInput = form.querySelector(`input[data-rule-index="${idx}"][data-unit="in"]`);
        const mft = parseInt(ftInput.value, 10) || 0;
        const min = parseInt(inInput.value, 10) || 0;
        const measuredTotal = toTotalInches(mft, min);
        const requiredTotal = toTotalInches(rule.requiredFt, rule.requiredIn);
        const diff = measuredTotal - requiredTotal;
        const pass = diff >= 0;
        const diffObj = fromTotalInches(Math.abs(diff));
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${rule.label}</td>
          <td>${rule.requiredFt}’- ${rule.requiredIn}”</td>
          <td>${mft}’- ${min}”</td>
          <td class="${pass ? 'pass' : 'fail'}">${pass ? 'Pass' : 'Fail'}</td>
          <td>${pass ? '+' : '-'}${diffObj.ft}’- ${diffObj.in}”</td>
        `;
        tableBody.appendChild(tr);
      });
      resultsSection.style.display = 'block';
    });
    const fileInput = container.querySelector('#clr-file');
    container.querySelector('#clr-import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (Array.isArray(data)) {
            rules = data;
            localStorage.setItem(rulesKey, JSON.stringify(rules));
            renderForm();
            alert('Settings imported.');
          }
        } catch {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
    container.querySelector('#clr-export').addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(rules, null, 2));
      alert('Settings copied to clipboard.');
    });
    container.querySelector('#clr-reset').addEventListener('click', () => {
      rules = clearanceDefaults[type].map(r => ({ ...r }));
      localStorage.removeItem(rulesKey);
      renderForm();
      alert('Defaults restored.');
    });
  }
})();