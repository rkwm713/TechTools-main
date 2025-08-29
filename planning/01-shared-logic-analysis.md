# Shared Logic Analysis Report
*Phase 2 Planning - TechTools Cross-Platform Development*

## Executive Summary

This document presents the comprehensive analysis of shared logic opportunities across the TechTools ecosystem (Chrome Extension, Web Application, and Desktop Application). The analysis reveals significant opportunities for code reuse and architectural improvements.

## Analysis Overview

### Platforms Analyzed
- **TechTools-ext**: Chrome Extension (JavaScript, Manifest V3)
- **TechTools-site**: Web Application (JavaScript, HTML5)
- **TechTools-desktop**: Desktop Application (Python, tkinter)

### Analysis Scope
1. ✅ **Mathematical Functions** - Core calculation algorithms
2. ✅ **Data Structures** - Schemas, templates, and storage patterns
3. ✅ **Business Logic** - Validation, workflows, and processing patterns

---

## 🔢 Mathematical Functions Analysis

### High Priority Shared Functions (100% Identical Logic)

#### Imperial Measurement Conversion
**Current Implementation Status**: Duplicated across all platforms

**JavaScript Implementation** (Extension + Web):
```javascript
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
```

**Python Implementation** (Desktop):
```python
def to_total_inches(ft: int, inch: int) -> int:
    return ft * 12 + inch

def from_total_inches(total: int) -> tuple[int, int]:
    sign = -1 if total < 0 else 1
    abs_val = abs(total)
    ft = (abs_val // 12) * sign
    inch = abs_val % 12
    return ft, inch
```

**Usage Frequency**: Used in every calculation tool across all platforms

#### Sag Calculation Algorithm
**Current Implementation Status**: Identical algorithm, duplicated code

**Shared Algorithm Steps**:
1. Convert all measurements to decimal feet
2. `neutralAvg = (neutral1 + neutral2) / 2`
3. `sagFactor = neutralAvg / neutralMidspan`
4. `fiberAvg = (fiber1 + fiber2) / 2`
5. `fiberSag = fiberAvg / sagFactor`
6. Convert back to feet/inches with rounding
7. Handle edge case: 12 inches = 1 foot

**Business Impact**: Complex engineering formula critical for field work accuracy

---

## 🗂️ Data Structures Analysis

### Shared Schemas (Perfect Alignment)

#### Clearance Rules Configuration
**Current Implementation Status**: Identical JSON schemas across Extension + Web

```javascript
const clearanceDefaults = {
  gnd2com: [
    {
      id: 'min_comm_ground_clearance',
      label: 'Minimum ground to communication clearance',
      requiredFt: 15,
      requiredIn: 6
    }
  ],
  gnd2pwr: [
    {
      id: 'min_power_ground_clearance', 
      label: 'Minimum ground to power clearance',
      requiredFt: 18,
      requiredIn: 0
    }
  ],
  bolt: [
    {
      id: 'min_supply_gap',
      label: 'Minimum separation to supply (40 in)',
      requiredFt: 3,
      requiredIn: 4
    },
    {
      id: 'min_com_gap',
      label: 'Minimum separation between communications (12 in)',
      requiredFt: 1,
      requiredIn: 0
    }
  ]
}
```

**Desktop Application Status**: ❌ Not implemented (missing clearance calculators)

#### Checklist Template Schema
**Current Implementation Status**: Identical parsing logic across Extension + Web

```javascript
// Template Structure:
[
  { type: 'section', text: 'Section Header' },
  { type: 'item', text: 'Checklist item', checked: false },
  { type: 'item', text: 'Another item', checked: true }
]

// Input Format:
// ### Section Header
// Checklist item
// Another item
```

**Desktop Application Status**: ❌ Not implemented

#### Storage Key Conventions
**Current Implementation Status**: Consistent naming across Extension + Web

- `fiHistory` - Feet & Inches calculation history
- `quicNote` - Note editor content (HTML)
- `qcTemplate` - Checklist template (text format)
- `clearanceRules-gnd2com` - GND2COM clearance settings
- `clearanceRules-gnd2pwr` - GND2PWR clearance settings  
- `clearanceRules-bolt` - Bolt hole clearance settings

**Desktop Application Status**: ❌ No equivalent storage system

---

## ⚙️ Business Logic Analysis

### Core Algorithms (100% Identical)

#### Input Validation Pattern
```javascript
// JavaScript Pattern
const values = inputs.map((input) => parseInt(input.value, 10));
const [ft, in] = values.map((v) => (isNaN(v) ? 0 : v));

// Robust fallback validation
const f = Number.isFinite(ft) ? ft : 0;
const i = Number.isFinite(inches) ? inches : 0;
```

```python
# Python Pattern (similar approach)
try:
    values = [int(e.get() or 0) for e in self.entries]
except ValueError:
    messagebox.showerror("Input error", "Please enter valid integers.")
    return
```

#### Clearance Pass/Fail Logic
```javascript
// Core Business Rule (identical across platforms)
const measuredTotal = toTotalInches(measuredFt, measuredIn);
const requiredTotal = toTotalInches(rule.requiredFt, rule.requiredIn);
const diff = measuredTotal - requiredTotal;
const pass = diff >= 0;  // Critical business logic

// Margin calculation
const diffObj = fromTotalInches(Math.abs(diff));
const margin = `${pass ? '+' : '-'}${diffObj.ft}'-${diffObj.in}"`;
```

#### History Management Pattern
```javascript
// Bounded array management (identical logic)
history.push(entry);
if (history.length > 4) history.shift();  // Keep only last 4
saveHistory();
updateHistoryList();
```

### User Experience Patterns

#### Sequential Input Navigation
```javascript
// Enter key workflow (identical UX)
inputs.forEach((input, idx) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < inputs.length - 1) {
        inputs[idx + 1].focus();  // Move to next input
      } else {
        compute();  // Calculate on last input
      }
    }
  });
});
```

**Desktop Status**: ❌ Not implemented (basic tab navigation only)

---

## Platform-Specific Implementations

### Clipboard Integration
**Web Platforms**: `navigator.clipboard.writeText(text)`
**Desktop Platform**: `self.clipboard_clear(); self.clipboard_append(content)`

### Data Persistence
**Web Platforms**: `localStorage` with JSON serialization
**Desktop Platform**: JSON files (not currently implemented)

### Error Handling
**Web Platforms**: DOM alerts and inline messages
**Desktop Platform**: tkinter messageboxes

---

## Critical Gaps Identified

### Desktop Application Deficiencies
1. ❌ **Missing Tools**: Only 3 of 7 tools implemented
2. ❌ **No Clearance Calculators**: Core business functionality missing
3. ❌ **No Data Persistence**: All data lost on application close
4. ❌ **No Import/Export**: Cannot share configurations
5. ❌ **Limited History**: No calculation history management

### Code Duplication Issues
1. 🔄 **Mathematical Functions**: Identical code in 3 locations
2. 🔄 **Business Logic**: Core algorithms duplicated
3. 🔄 **Data Schemas**: Same structures defined multiple times
4. 🔄 **Validation Logic**: Input validation patterns repeated

---

## Recommendations

### Immediate Actions (High Priority)
1. **Extract Shared Core Library**: Create platform-agnostic calculation modules
2. **Standardize Data Schemas**: Define JSON schemas for all data structures
3. **Complete Desktop Implementation**: Add missing tools and functionality
4. **Implement Desktop Persistence**: JSON file-based storage system

### Architectural Improvements (Medium Priority)
1. **Platform Adapter Pattern**: Separate core logic from platform-specific APIs
2. **Shared Configuration**: Common default values and settings
3. **Cross-Platform Testing**: Ensure algorithm consistency
4. **Documentation Standards**: API documentation for shared modules

### Long-term Goals (Future Phases)
1. **Sync Capabilities**: Data synchronization between platforms
2. **Plugin Architecture**: Extensible calculation system
3. **Advanced Validation**: Enhanced input validation and error handling
4. **Performance Optimization**: Optimized calculation algorithms

---

## Next Steps

1. **Create Shared Core Module Architecture** (Next planning document)
2. **Design Platform Adapter Interfaces** 
3. **Plan Desktop Application Enhancement**
4. **Define Cross-Platform Testing Strategy**
5. **Establish Development Workflow for Shared Code**

---

*This analysis forms the foundation for Phase 3 (Implementation) planning and provides clear direction for architectural improvements across the TechTools ecosystem.*
