// TechTools Unified Clearance Analysis System - Ultra-Compact Professional UI

const nescStandards = {
  communication: [
    { id: 'railroad_tracks', label: 'Track rails of railroads (non-electrified) - NESC Rule 232', requiredFt: 23, requiredIn: 6, category: 'transportation' },
    { id: 'roads_truck_traffic', label: 'Roads, streets subject to truck traffic - NESC Rule 232', requiredFt: 15, requiredIn: 6, category: 'transportation' },
    { id: 'alleys_no_trucks', label: 'Alleys, driveways not subject to truck traffic - NESC Rule 232', requiredFt: 15, requiredIn: 6, category: 'transportation' },
    { id: 'vehicle_areas', label: 'Other areas traversed by vehicles (grazing, orchards) - NESC Rule 232', requiredFt: 15, requiredIn: 6, category: 'transportation' },
    { id: 'highway_parallel', label: 'Lines along highways (not crossing roadway) - NESC Rule 232', requiredFt: 15, requiredIn: 6, category: 'transportation' },
    { id: 'restricted_vehicle', label: 'Roads unlikely for vehicle passage (fenced alleys) - NESC Rule 232', requiredFt: 13, requiredIn: 6, category: 'transportation' },
    { id: 'pedestrian_only', label: 'Pedestrian or restricted traffic areas only - NESC Rule 232', requiredFt: 9, requiredIn: 6, category: 'pedestrian' },
    { id: 'water_no_sailing', label: 'Water areas not suitable for sailboating - NESC Rule 232', requiredFt: 14, requiredIn: 0, category: 'water' },
    { id: 'water_sailing_small', label: 'Water suitable for sailboating (< 20 acres) - NESC Rule 232', requiredFt: 17, requiredIn: 6, category: 'water' },
    { id: 'water_sailing_medium', label: 'Water suitable for sailboating (20-200 acres) - NESC Rule 232', requiredFt: 25, requiredIn: 6, category: 'water' },
    { id: 'water_sailing_large', label: 'Water suitable for sailboating (200-2000 acres) - NESC Rule 232', requiredFt: 31, requiredIn: 6, category: 'water' },
    { id: 'water_sailing_xlarge', label: 'Water suitable for sailboating (> 2000 acres) - NESC Rule 232', requiredFt: 37, requiredIn: 6, category: 'water' },
    { id: 'residential_driveway', label: 'Insulated communication service drops over residential driveways - NESC Rule 232', requiredFt: 11, requiredIn: 6, category: 'special' }
  ],
  
  power: [
    { id: 'railroad_supply', label: 'Track rails of railroads - Supply cables - NESC Rule 232', requiredFt: 24, requiredIn: 0, category: 'transportation' },
    { id: 'railroad_open', label: 'Track rails of railroads - Open supply conductors - NESC Rule 232', requiredFt: 25, requiredIn: 4, category: 'transportation' },
    { id: 'roads_supply', label: 'Roads, streets subject to truck traffic - Supply cables (0-750V) - NESC Rule 232', requiredFt: 16, requiredIn: 6, category: 'transportation' },
    { id: 'roads_open', label: 'Roads, streets subject to truck traffic - Open supply conductors - NESC Rule 232', requiredFt: 18, requiredIn: 6, category: 'transportation' },
    { id: 'alleys_supply', label: 'Alleys, driveways not subject to truck traffic - Supply cables - NESC Rule 232', requiredFt: 16, requiredIn: 6, category: 'transportation' },
    { id: 'vehicle_supply', label: 'Other areas traversed by vehicles - Supply cables - NESC Rule 232', requiredFt: 16, requiredIn: 6, category: 'transportation' },
    { id: 'highway_supply', label: 'Lines along highways (not crossing) - Supply cables - NESC Rule 232', requiredFt: 16, requiredIn: 6, category: 'transportation' },
    { id: 'restricted_supply', label: 'Roads unlikely for vehicles - Supply cables - NESC Rule 232', requiredFt: 14, requiredIn: 0, category: 'transportation' },
    { id: 'pedestrian_supply', label: 'Pedestrian areas - Supply cables - NESC Rule 232', requiredFt: 12, requiredIn: 6, category: 'pedestrian' },
    { id: 'water_supply_no_sailing', label: 'Water not suitable for sailboating - Supply cables - NESC Rule 232', requiredFt: 14, requiredIn: 6, category: 'water' },
    { id: 'water_supply_small', label: 'Water suitable for sailboating (< 20 acres) - Supply - NESC Rule 232', requiredFt: 18, requiredIn: 6, category: 'water' },
    { id: 'water_supply_medium', label: 'Water suitable for sailboating (20-200 acres) - Supply - NESC Rule 232', requiredFt: 28, requiredIn: 6, category: 'water' },
    { id: 'water_supply_large', label: 'Water suitable for sailboating (200-2000 acres) - Supply - NESC Rule 232', requiredFt: 34, requiredIn: 6, category: 'water' },
    { id: 'water_supply_xlarge', label: 'Water suitable for sailboating (> 2000 acres) - Supply - NESC Rule 232', requiredFt: 40, requiredIn: 6, category: 'water' }
  ]
};

const clearanceTypes = {
  'roads_truck': { 
    label: 'Roads & Streets (Truck Traffic)', 
    commId: 'roads_truck_traffic', 
    powerId: 'roads_supply',
    description: 'Standard road crossings with truck access'
  },
  'alleys': { 
    label: 'Alleys & Driveways (No Trucks)', 
    commId: 'alleys_no_trucks', 
    powerId: 'alleys_supply',
    description: 'Residential areas without truck access'
  },
  'pedestrian': { 
    label: 'Pedestrian Areas Only', 
    commId: 'pedestrian_only', 
    powerId: 'pedestrian_supply',
    description: 'Walkways and restricted traffic areas'
  },
  'railroad': { 
    label: 'Railroad Crossings', 
    commId: 'railroad_tracks', 
    powerId: 'railroad_supply',
    description: 'Over railroad tracks (non-electrified)'
  },
  'water_small': { 
    label: 'Water Areas (< 20 acres)', 
    commId: 'water_sailing_small', 
    powerId: 'water_supply_small',
    description: 'Small water bodies suitable for sailboating'
  },
  'water_medium': { 
    label: 'Water Areas (20-200 acres)', 
    commId: 'water_sailing_medium', 
    powerId: 'water_supply_medium',
    description: 'Medium water bodies suitable for sailboating'
  },
  'residential': { 
    label: 'Residential Service Drops', 
    commId: 'residential_driveway', 
    powerId: 'roads_supply',
    description: 'Service drops over residential driveways'
  }
};

function buildUnifiedClearanceTools() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tool-section">
      <div class="measurement-grid two-column" style="margin-bottom: 0.75rem;">
        <div class="measurement-group">
          <label style="font-size: 0.85rem;">Power Line Height <small style="color: #999;">(20-50 ft)</small></label>
          <div id="power-input-wrapper"></div>
        </div>
        <div class="measurement-group">
          <label style="font-size: 0.85rem;">Communication Height <small style="color: #999;">(12-35 ft)</small></label>
          <div id="comm-input-wrapper"></div>
        </div>
      </div>

      <div id="ocr-upload-section"></div>

      <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; margin: 0.75rem 0; align-items: end;">
        <div>
          <label for="clearance-type-select" style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem; display: block;">
            Clearance Scenario
          </label>
          <select id="clearance-type-select" style="width: 100%; padding: 0.4rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.85rem;">
            <option value="">Select scenario...</option>
            <optgroup label="Transportation">
              <option value="roads_truck">Roads & Streets (Truck Traffic)</option>
              <option value="alleys">Alleys & Driveways</option>
              <option value="railroad">Railroad Crossings</option>
            </optgroup>
            <optgroup label="Other">
              <option value="pedestrian">Pedestrian Areas</option>
              <option value="water_small">Water (< 20 acres)</option>
              <option value="residential">Service Drops</option>
            </optgroup>
          </select>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="analyze-btn" class="btn" disabled>Analyze</button>
          <button id="clear-btn" class="btn secondary">Clear</button>
          <button id="swap-btn" class="btn secondary" style="display: none;">↕</button>
        </div>
      </div>
      
      <div id="analysis-preview" style="font-size: 0.8rem; color: #666; text-align: center; margin: 0.5rem 0;"></div>
    </div>

    <div class="tool-section" id="results-section" style="display: none;">
      <div id="analysis-summary" style="margin-bottom: 0.75rem;"></div>
      
      <div style="background: #fff8e1; border-left: 3px solid var(--color-warning); padding: 0.5rem; margin: 0.5rem 0; border-radius: 0 var(--radius) var(--radius) 0;">
        <div style="font-weight: 600; color: #e65100; font-size: 0.8rem;">Industry Disclaimer</div>
        <div style="font-size: 0.75rem; color: #bf360c; line-height: 1.2;">
          Exceptions may exist. Verify with source documentation. Local standards may differ from NESC minimums.
        </div>
      </div>

      <div id="results-content"></div>

      <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.75rem;">
        <button id="copy-analysis" class="btn secondary" disabled style="font-size: 0.8rem; padding: 0.5rem 0.75rem;">Copy</button>
        <button id="save-config" class="btn secondary" disabled style="font-size: 0.8rem; padding: 0.5rem 0.75rem;">Save</button>
        <button id="new-analysis" class="btn secondary" style="font-size: 0.8rem; padding: 0.5rem 0.75rem;">New</button>
      </div>
    </div>
  `;
  
  window.TechTools.Navigation.toolContent.appendChild(container);
  initializeSystem(container);
}

function initializeSystem(container) {
  const powerInputWrapper = container.querySelector('#power-input-wrapper');
  const commInputWrapper = container.querySelector('#comm-input-wrapper');
  const ocrUploadSection = container.querySelector('#ocr-upload-section');
  const clearanceTypeSelect = container.querySelector('#clearance-type-select');
  const analysisPreview = container.querySelector('#analysis-preview');
  const analyzeBtn = container.querySelector('#analyze-btn');
  const clearBtn = container.querySelector('#clear-btn');
  const swapBtn = container.querySelector('#swap-btn');
  const resultsSection = container.querySelector('#results-section');
  const analysisSummary = container.querySelector('#analysis-summary');
  const resultsContent = container.querySelector('#results-content');
  const copyAnalysisBtn = container.querySelector('#copy-analysis');
  const saveConfigBtn = container.querySelector('#save-config');
  const newAnalysisBtn = container.querySelector('#new-analysis');
  
  let powerInput = null;
  let commInput = null;
  let currentAnalysisMode = 'NONE';
  let analysisResults = null;
  
  // Create smart inputs
  powerInput = window.TechTools.SmartInput.createSmartInput('25-0', 'Power line height');
  commInput = window.TechTools.SmartInput.createSmartInput('21-8', 'Communication height');
  
  powerInputWrapper.appendChild(powerInput.wrapper);
  commInputWrapper.appendChild(commInput.wrapper);
  
  // Add ultra-compact OCR
  if (window.OCRSystem && window.OCRSystem.available) {
    const microOCR = document.createElement('div');
    microOCR.style.cssText = 'text-align: center; font-size: 0.75rem; color: #666; margin: 0.5rem 0; padding: 0.4rem; background: #f9f9f9; border-radius: 4px;';
    microOCR.innerHTML = `
      <span>Paste screenshot (Ctrl+V) or </span>
      <button style="background: none; border: none; color: var(--color-accent); text-decoration: underline; cursor: pointer; font-size: inherit;" id="uploadBtn">upload</button>
      <input type="file" id="imageInput" accept="image/*" style="display: none;" />
      <div id="uploadStatus" style="display: none; margin-top: 0.25rem;"></div>
    `;
    ocrUploadSection.appendChild(microOCR);
    
    setupMicroOCR(microOCR);
  }
  
  // Add input listeners
  [powerInput, commInput].forEach(input => {
    input.input.addEventListener('input', updateAnalysisPreview);
    input.input.addEventListener('blur', updateAnalysisPreview);
  });
  
  clearanceTypeSelect.addEventListener('change', updateAnalysisPreview);
  
  // Keyboard navigation
  powerInput.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commInput.input.focus();
    } else if (e.key === 'Escape') {
      clearAll();
      e.preventDefault();
    }
  });
  
  commInput.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearanceTypeSelect.focus();
    } else if (e.key === 'Escape') {
      clearAll();
      e.preventDefault();
    }
  });
  
  clearanceTypeSelect.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!analyzeBtn.disabled) performAnalysis();
    }
  });
  
  // Event listeners
  analyzeBtn.addEventListener('click', performAnalysis);
  clearBtn.addEventListener('click', clearAll);
  swapBtn.addEventListener('click', swapHeights);
  newAnalysisBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    analysisResults = null;
    updateAnalysisPreview();
    powerInput.input.focus();
  });
  
  copyAnalysisBtn.addEventListener('click', copyCompleteAnalysis);
  saveConfigBtn.addEventListener('click', saveConfiguration);
  
  function setupMicroOCR(microOCR) {
    const uploadBtn = microOCR.querySelector('#uploadBtn');
    const imageInput = microOCR.querySelector('#imageInput');
    const uploadStatus = microOCR.querySelector('#uploadStatus');
    
    uploadBtn.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) processMicroImage(file, uploadStatus);
    });
    
    // Global paste support
    const handlePaste = (e) => {
      if (!microOCR.isConnected) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            console.log('Screenshot pasted');
            processMicroImage(file, uploadStatus);
            break;
          }
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    
    async function processMicroImage(file, statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '<span style="color: var(--color-primary);">Processing...</span>';
      
      try {
        const result = await window.OCRSystem.extractMeasurements(file, () => {});
        
        if (result.success && result.measurements.length > 0) {
          const measurement = result.measurements[0];
          const isLikelyPower = measurement.totalInches >= 240;
          
          const targetInput = isLikelyPower ? powerInput : commInput;
          targetInput.input.value = measurement.formatted.replace(/['"-]/g, '-').replace(/--+/g, '-');
          targetInput.input.dispatchEvent(new Event('input'));
          targetInput.input.dispatchEvent(new Event('blur'));
          
          statusEl.innerHTML = `<span style="color: var(--color-success);">${measurement.formatted} extracted</span>`;
          setTimeout(() => statusEl.style.display = 'none', 2000);
          
          window.TechTools.UI.showAlert('Measurement extracted', 'success');
        } else {
          statusEl.innerHTML = '<span style="color: var(--color-error);">No measurements found</span>';
          setTimeout(() => statusEl.style.display = 'none', 2000);
        }
      } catch (error) {
        statusEl.innerHTML = '<span style="color: var(--color-error);">Failed</span>';
        setTimeout(() => statusEl.style.display = 'none', 2000);
      }
    }
  }
  
  function updateAnalysisPreview() {
    const powerResult = window.TechTools.SmartInput.getValue(powerInput.input);
    const commResult = window.TechTools.SmartInput.getValue(commInput.input);
    const selectedType = clearanceTypeSelect.value;
    
    const hasPower = powerResult.isValid && powerResult.totalInches > 0;
    const hasComm = commResult.isValid && commResult.totalInches > 0;
    
    if (hasPower && hasComm) {
      currentAnalysisMode = 'COMPREHENSIVE';
      analysisPreview.textContent = selectedType 
        ? `Primary: ${clearanceTypes[selectedType].label} + 27 reference standards`
        : 'Pole separation + 27 standards (Select scenario for primary compliance)';
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze (28)';
      swapBtn.style.display = 'inline-block';
      
      if (commResult.totalInches >= powerResult.totalInches) {
        analysisPreview.innerHTML = analysisPreview.textContent + ' <span style="color: var(--color-warning);">⚠ Comm > Power</span>';
      }
    } else if (hasPower) {
      currentAnalysisMode = 'POWER_TO_GROUND';
      analysisPreview.textContent = selectedType 
        ? `Primary: ${clearanceTypes[selectedType].label} + 13 reference standards`
        : '14 power standards (Select scenario for primary compliance)';
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze (14)';
      swapBtn.style.display = 'none';
    } else if (hasComm) {
      currentAnalysisMode = 'COMM_TO_GROUND';
      analysisPreview.textContent = selectedType 
        ? `Primary: ${clearanceTypes[selectedType].label} + 12 reference standards`
        : '13 communication standards (Select scenario for primary compliance)';
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze (13)';
      swapBtn.style.display = 'none';
    } else {
      currentAnalysisMode = 'NONE';
      analysisPreview.textContent = '';
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Enter Heights';
      swapBtn.style.display = 'none';
    }
  }
  
  function performAnalysis() {
    const hideLoading = window.TechTools.UI.showLoading(analyzeBtn, '...');
    const selectedType = clearanceTypeSelect.value;
    
    try {
      const powerResult = window.TechTools.SmartInput.getValue(powerInput.input);
      const commResult = window.TechTools.SmartInput.getValue(commInput.input);
      
      if (currentAnalysisMode === 'COMPREHENSIVE') {
        analysisResults = performComprehensiveAnalysis(powerResult, commResult, selectedType);
      } else if (currentAnalysisMode === 'POWER_TO_GROUND') {
        analysisResults = performPowerAnalysis(powerResult, selectedType);
      } else if (currentAnalysisMode === 'COMM_TO_GROUND') {
        analysisResults = performCommAnalysis(commResult, selectedType);
      }
      
      displayResults(analysisResults);
      
    } catch (error) {
      console.error('Analysis error:', error);
      window.TechTools.UI.showAlert('Analysis failed', 'error');
    } finally {
      hideLoading();
    }
  }
  
  function performComprehensiveAnalysis(powerResult, commResult, primaryType) {
    const separationInches = powerResult.totalInches - commResult.totalInches;
    const meets40Inch = separationInches >= 40;
    const separationObj = window.TechTools.Utils.fromTotalInches(Math.max(0, separationInches));
    const marginObj = window.TechTools.Utils.fromTotalInches(Math.abs(separationInches - 40));
    
    const commClearances = analyzeStandards(commResult, nescStandards.communication);
    const powerClearances = analyzeStandards(powerResult, nescStandards.power);
    
    let primaryCompliance = null;
    if (primaryType && clearanceTypes[primaryType]) {
      const typeConfig = clearanceTypes[primaryType];
      const commStandard = nescStandards.communication.find(s => s.id === typeConfig.commId);
      const powerStandard = nescStandards.power.find(s => s.id === typeConfig.powerId);
      
      let primaryPasses = 0;
      let primaryTotal = 0;
      
      if (meets40Inch) primaryPasses++;
      primaryTotal++;
      
      if (commResult.isValid && commStandard) {
        const commRequiredTotal = window.TechTools.Utils.toTotalInches(commStandard.requiredFt, commStandard.requiredIn);
        if (commResult.totalInches >= commRequiredTotal) primaryPasses++;
        primaryTotal++;
      }
      
      if (powerResult.isValid && powerStandard) {
        const powerRequiredTotal = window.TechTools.Utils.toTotalInches(powerStandard.requiredFt, powerStandard.requiredIn);
        if (powerResult.totalInches >= powerRequiredTotal) primaryPasses++;
        primaryTotal++;
      }
      
      primaryCompliance = {
        type: typeConfig.label,
        passes: primaryPasses,
        total: primaryTotal,
        compliant: primaryPasses === primaryTotal,
        percentage: Math.round((primaryPasses / primaryTotal) * 100)
      };
    }
    
    const totalChecks = 1 + commClearances.details.length + powerClearances.details.length;
    const totalPassed = (meets40Inch ? 1 : 0) + commClearances.passed + powerClearances.passed;
    
    return {
      mode: 'COMPREHENSIVE',
      timestamp: new Date().toLocaleString(),
      powerHeight: powerResult,
      commHeight: commResult,
      selectedClearanceType: primaryType,
      primaryCompliance,
      poleSeparation: {
        separation: `${separationObj.ft}'-${separationObj.in}"`,
        separationInches,
        meets40Inch,
        margin: `${separationInches >= 40 ? '+' : '-'}${marginObj.ft}'-${marginObj.in}"`
      },
      commClearances,
      powerClearances,
      overallSummary: {
        totalChecks,
        totalPassed,
        totalFailed: totalChecks - totalPassed,
        overallCompliance: primaryCompliance ? primaryCompliance.compliant : (totalChecks === totalPassed),
        compliancePercentage: primaryCompliance ? primaryCompliance.percentage : Math.round((totalPassed / totalChecks) * 100),
        usedPrimaryType: !!primaryCompliance
      }
    };
  }
  
  function performPowerAnalysis(powerResult, primaryType) {
    const powerClearances = analyzeStandards(powerResult, nescStandards.power);
    
    let primaryCompliance = null;
    if (primaryType && clearanceTypes[primaryType]) {
      const typeConfig = clearanceTypes[primaryType];
      const powerStandard = nescStandards.power.find(s => s.id === typeConfig.powerId);
      
      if (powerStandard) {
        const requiredTotal = window.TechTools.Utils.toTotalInches(powerStandard.requiredFt, powerStandard.requiredIn);
        const passes = powerResult.totalInches >= requiredTotal;
        
        primaryCompliance = {
          type: typeConfig.label,
          passes: passes ? 1 : 0,
          total: 1,
          compliant: passes,
          percentage: passes ? 100 : 0
        };
      }
    }
    
    return {
      mode: 'POWER_TO_GROUND',
      timestamp: new Date().toLocaleString(),
      powerHeight: powerResult,
      selectedClearanceType: primaryType,
      primaryCompliance,
      powerClearances,
      overallSummary: {
        totalChecks: powerClearances.details.length,
        totalPassed: powerClearances.passed,
        totalFailed: powerClearances.failed,
        overallCompliance: primaryCompliance ? primaryCompliance.compliant : (powerClearances.failed === 0),
        compliancePercentage: primaryCompliance ? primaryCompliance.percentage : Math.round((powerClearances.passed / powerClearances.details.length) * 100),
        usedPrimaryType: !!primaryCompliance
      }
    };
  }
  
  function performCommAnalysis(commResult, primaryType) {
    const commClearances = analyzeStandards(commResult, nescStandards.communication);
    
    let primaryCompliance = null;
    if (primaryType && clearanceTypes[primaryType]) {
      const typeConfig = clearanceTypes[primaryType];
      const commStandard = nescStandards.communication.find(s => s.id === typeConfig.commId);
      
      if (commStandard) {
        const requiredTotal = window.TechTools.Utils.toTotalInches(commStandard.requiredFt, commStandard.requiredIn);
        const passes = commResult.totalInches >= requiredTotal;
        
        primaryCompliance = {
          type: typeConfig.label,
          passes: passes ? 1 : 0,
          total: 1,
          compliant: passes,
          percentage: passes ? 100 : 0
        };
      }
    }
    
    return {
      mode: 'COMM_TO_GROUND',
      timestamp: new Date().toLocaleString(),
      commHeight: commResult,
      selectedClearanceType: primaryType,
      primaryCompliance,
      commClearances,
      overallSummary: {
        totalChecks: commClearances.details.length,
        totalPassed: commClearances.passed,
        totalFailed: commClearances.failed,
        overallCompliance: primaryCompliance ? primaryCompliance.compliant : (commClearances.failed === 0),
        compliancePercentage: primaryCompliance ? primaryCompliance.percentage : Math.round((commClearances.passed / commClearances.details.length) * 100),
        usedPrimaryType: !!primaryCompliance
      }
    };
  }
  
  function analyzeStandards(measurement, standards) {
    const results = [];
    let passed = 0;
    let failed = 0;
    
    standards.forEach(standard => {
      const requiredTotal = window.TechTools.Utils.toTotalInches(standard.requiredFt, standard.requiredIn);
      const diff = measurement.totalInches - requiredTotal;
      const pass = diff >= 0;
      const diffObj = window.TechTools.Utils.fromTotalInches(Math.abs(diff));
      
      if (pass) passed++;
      else failed++;
      
      results.push({
        id: standard.id,
        rule: standard.label,
        required: `${standard.requiredFt}'-${standard.requiredIn}"`,
        measured: measurement.formatted,
        pass,
        margin: `${pass ? '+' : '-'}${diffObj.ft}'-${diffObj.in}"`,
        category: standard.category || 'general'
      });
    });
    
    return { details: results, passed, failed };
  }
  
  function displayResults(results) {
    const isCompliant = results.overallSummary.overallCompliance;
    const usedPrimary = results.overallSummary.usedPrimaryType;
    
    // Compact summary
    analysisSummary.style.cssText = `
      padding: 0.75rem; border-radius: var(--radius); font-weight: 600; font-size: 0.95rem;
      background-color: ${isCompliant ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
      color: ${isCompliant ? 'var(--color-success)' : 'var(--color-error)'};
      border: 1px solid ${isCompliant ? 'var(--color-success)' : 'var(--color-error)'};
    `;
    
    const complianceText = usedPrimary && results.primaryCompliance 
      ? `${results.primaryCompliance.type.toUpperCase()} COMPLIANCE`
      : (isCompliant ? 'NESC COMPLIANT' : 'NON-COMPLIANT');
    
    analysisSummary.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="margin-bottom: 0.15rem;">${complianceText}</div>
          <div style="font-size: 0.8rem; opacity: 0.8; font-weight: normal;">
            ${usedPrimary && results.primaryCompliance ? 'Primary scenario compliance' : 'All standards compliance'}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.1rem;">${results.overallSummary.compliancePercentage}%</div>
          <div style="font-size: 0.75rem; opacity: 0.8; font-weight: normal;">
            ${usedPrimary && results.primaryCompliance 
              ? `${results.primaryCompliance.passes}/${results.primaryCompliance.total} primary`
              : `${results.overallSummary.totalPassed}/${results.overallSummary.totalChecks} total`
            }
          </div>
        </div>
      </div>
    `;
    
    let content = '';
    
    if (results.mode === 'COMPREHENSIVE') {
      content = `
        <div style="background: white; border-radius: var(--radius); padding: 0.75rem; box-shadow: var(--shadow); margin-bottom: 1rem;">
          <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: center; text-align: center; font-size: 0.85rem;">
            <div style="background: #e3f2fd; padding: 0.5rem; border-radius: 4px;">
              <div style="font-weight: 600; color: var(--color-primary); font-size: 0.8rem;">Power</div>
              <div style="font-size: 1rem; margin: 0.1rem 0;">${results.powerHeight.formatted}</div>
            </div>
            <div style="color: ${results.poleSeparation.meets40Inch ? 'var(--color-success)' : 'var(--color-error)'};">
              <div style="font-size: 1.2rem;">${results.poleSeparation.meets40Inch ? '✓' : '✗'}</div>
              <div style="font-weight: 600; font-size: 0.9rem;">${results.poleSeparation.separation}</div>
              <div style="font-size: 0.7rem; color: #666;">separation</div>
            </div>
            <div style="background: #f3e5f5; padding: 0.5rem; border-radius: 4px;">
              <div style="font-weight: 600; color: #7b1fa2; font-size: 0.8rem;">Communication</div>
              <div style="font-size: 1rem; margin: 0.1rem 0;">${results.commHeight.formatted}</div>
            </div>
          </div>
        </div>
        
        <h4 style="margin: 0 0 0.4rem 0; font-size: 0.9rem; color: #7b1fa2;">Communication (${results.commClearances.passed}/${results.commClearances.details.length})</h4>
        ${buildUltraCompactTable(results.commClearances, results.selectedClearanceType, 'communication')}
        
        <h4 style="margin: 1rem 0 0.4rem 0; font-size: 0.9rem; color: var(--color-primary);">Power (${results.powerClearances.passed}/${results.powerClearances.details.length})</h4>
        ${buildUltraCompactTable(results.powerClearances, results.selectedClearanceType, 'power')}
      `;
    } else if (results.mode === 'POWER_TO_GROUND') {
      content = `
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--color-primary);">Power Clearances - ${results.powerHeight.formatted}</h4>
        ${buildUltraCompactTable(results.powerClearances, results.selectedClearanceType, 'power')}
      `;
    } else if (results.mode === 'COMM_TO_GROUND') {
      content = `
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #7b1fa2;">Communication Clearances - ${results.commHeight.formatted}</h4>
        ${buildUltraCompactTable(results.commClearances, results.selectedClearanceType, 'communication')}
      `;
    }
    
    resultsContent.innerHTML = content;
    resultsSection.style.display = 'block';
    copyAnalysisBtn.disabled = false;
    saveConfigBtn.disabled = false;
    
    const message = isCompliant 
      ? (usedPrimary ? `${results.primaryCompliance.type} compliant` : 'All checks passed') 
      : (usedPrimary ? `${results.primaryCompliance.type} non-compliant` : `${results.overallSummary.totalFailed} failed`);
    window.TechTools.UI.showAlert(message, isCompliant ? 'success' : 'error');
  }
  
  function buildUltraCompactTable(clearanceResults, selectedType, standardType) {
    const typeConfig = selectedType ? clearanceTypes[selectedType] : null;
    const primaryId = typeConfig ? (standardType === 'communication' ? typeConfig.commId : typeConfig.powerId) : null;
    
    return `
      <div style="overflow-x: auto; margin-bottom: 0.5rem;">
        <table class="clearance-table ultra-compact">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="font-size: 0.7rem; padding: 0.3rem; text-transform: uppercase; color: var(--color-primary);">NESC Requirement</th>
              <th style="font-size: 0.7rem; padding: 0.3rem; text-align: center;">Required</th>
              <th style="font-size: 0.7rem; padding: 0.3rem; text-align: center;">Measured</th>
              <th style="font-size: 0.7rem; padding: 0.3rem; text-align: center;">Status</th>
              <th style="font-size: 0.7rem; padding: 0.3rem; text-align: center;">Margin</th>
            </tr>
          </thead>
          <tbody>
            ${clearanceResults.details.map(detail => {
              const isPrimary = primaryId && detail.id === primaryId;
              return `
                <tr class="${detail.pass ? 'clearance-pass' : 'clearance-fail'}${isPrimary ? ' primary-clearance' : ''}">
                  <td style="font-size: 0.75rem; padding: 0.4rem; ${isPrimary ? 'font-weight: 700; border-left: 3px solid var(--color-accent);' : ''}">
                    ${detail.rule.replace(' - NESC Rule 232', '')}${isPrimary ? ' (Primary)' : ''}
                  </td>
                  <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600;">${detail.required}</td>
                  <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600;">${detail.measured}</td>
                  <td style="text-align: center; padding: 0.4rem;">
                    <span style="padding: 0.1rem 0.3rem; border-radius: 6px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; 
                          background: ${detail.pass ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)'}; 
                          color: ${detail.pass ? 'var(--color-success)' : 'var(--color-error)'}; 
                          ${isPrimary ? 'border: 1px solid var(--color-accent);' : ''}">
                      ${detail.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td style="text-align: center; font-size: 0.8rem; padding: 0.4rem; font-weight: 600; color: ${detail.pass ? 'var(--color-success)' : 'var(--color-error)'};">
                    ${detail.margin}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  function swapHeights() {
    const powerValue = powerInput.input.value;
    const commValue = commInput.input.value;
    
    powerInput.input.value = commValue;
    commInput.input.value = powerValue;
    
    [powerInput, commInput].forEach(input => {
      input.input.dispatchEvent(new Event('input'));
      input.input.dispatchEvent(new Event('blur'));
    });
    
    window.TechTools.UI.showAlert('Swapped', 'success');
    updateAnalysisPreview();
  }
  
  function clearAll() {
    [powerInput, commInput].forEach(input => {
      input.input.value = '';
      input.input.classList.remove('input-valid', 'input-invalid', 'input-empty');
      input.input.classList.add('input-empty');
      input.input.dispatchEvent(new Event('input'));
    });
    
    clearanceTypeSelect.value = '';
    resultsSection.style.display = 'none';
    analysisResults = null;
    updateAnalysisPreview();
    powerInput.input.focus();
  }
  
  function copyCompleteAnalysis() {
    if (!analysisResults) return;
    
    let report = `NESC-2023 CLEARANCE ANALYSIS\n${analysisResults.timestamp}\n\n`;
    
    if (analysisResults.primaryCompliance) {
      report += `PRIMARY: ${analysisResults.primaryCompliance.type} - ${analysisResults.primaryCompliance.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n\n`;
    }
    
    if (analysisResults.mode === 'COMPREHENSIVE') {
      report += `POLE: Power ${analysisResults.powerHeight.formatted} | Comm ${analysisResults.commHeight.formatted} | Sep ${analysisResults.poleSeparation.separation}\n\n`;
    }
    
    if (analysisResults.commClearances) {
      report += `COMMUNICATION (${analysisResults.commClearances.passed}/${analysisResults.commClearances.details.length}):\n`;
      analysisResults.commClearances.details.forEach(detail => {
        const primary = analysisResults.selectedClearanceType && clearanceTypes[analysisResults.selectedClearanceType] && detail.id === clearanceTypes[analysisResults.selectedClearanceType].commId ? ' (PRIMARY)' : '';
        report += `${detail.pass ? '✓' : '✗'} ${detail.rule.split(' - ')[0]}${primary}: ${detail.margin}\n`;
      });
      report += '\n';
    }
    
    if (analysisResults.powerClearances) {
      report += `POWER (${analysisResults.powerClearances.passed}/${analysisResults.powerClearances.details.length}):\n`;
      analysisResults.powerClearances.details.forEach(detail => {
        const primary = analysisResults.selectedClearanceType && clearanceTypes[analysisResults.selectedClearanceType] && detail.id === clearanceTypes[analysisResults.selectedClearanceType].powerId ? ' (PRIMARY)' : '';
        report += `${detail.pass ? '✓' : '✗'} ${detail.rule.split(' - ')[0]}${primary}: ${detail.margin}\n`;
      });
    }
    
    report += `\nCOMPLIANCE: ${results.overallSummary.compliancePercentage}% - ${results.overallSummary.overallCompliance ? 'COMPLIANT' : 'NON-COMPLIANT'}`;
    
    window.TechTools.UI.copyToClipboard(report, 'Copied');
  }
  
  function saveConfiguration() {
    if (!analysisResults) return;
    
    const config = {
      powerHeight: analysisResults.powerHeight?.formatted || '',
      commHeight: analysisResults.commHeight?.formatted || '',
      selectedClearanceType: analysisResults.selectedClearanceType || '',
      mode: analysisResults.mode,
      compliance: analysisResults.overallSummary.compliancePercentage
    };
    
    window.TechTools.Storage.save('savedPoleConfig', config);
    window.TechTools.UI.showAlert('Saved', 'success');
  }
  
  updateAnalysisPreview();
  powerInput.input.focus();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.TechTools.Navigation) {
    window.TechTools.Navigation.registerTool('clearance-tools', buildUnifiedClearanceTools);
    console.log('Ultra-Compact Clearance System registered');
  }
});

console.log('Ultra-Compact Clearance System loaded');