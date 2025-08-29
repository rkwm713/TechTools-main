# Architecture Recommendations
*Phase 2 Planning - TechTools Modular Architecture Design*

## Overview

Based on the shared logic analysis, this document outlines the recommended architectural approach for implementing code sharing across the TechTools ecosystem while maintaining platform-specific optimizations.

---

## 🏗️ Proposed Architecture

### Core Principle: Shared Logic + Platform Adapters

```
┌─────────────────────────────────────────────────────────────┐
│                    TechTools Core Library                  │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   Mathematical  │   Business      │   Data          │   │
│  │   Functions     │   Logic         │   Schemas       │   │
│  │                 │                 │                 │   │
│  │ • toTotalInches │ • Validation    │ • Clearance     │   │
│  │ • sagCalc       │ • Pass/Fail     │ • Templates     │   │
│  │ • formatting    │ • History Mgmt  │ • Storage Keys  │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Extension     │  │   Web App       │  │   Desktop       │
│   Adapter       │  │   Adapter       │  │   Adapter       │
│                 │  │                 │  │                 │
│ • DOM Events    │  │ • DOM Events    │  │ • tkinter       │
│ • localStorage  │  │ • localStorage  │  │ • JSON Files    │
│ • Clipboard API │  │ • Clipboard API │  │ • System Clip   │
│ • MV3 Manifest  │  │ • Full Page UI  │  │ • Native Window │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 📚 Shared Core Library Design

### Module Structure

```
techtools-core/
├── math/
│   ├── imperial-conversion.js
│   ├── sag-calculations.js
│   └── measurement-utils.js
├── business-logic/
│   ├── input-validation.js
│   ├── clearance-calculator.js
│   ├── history-manager.js
│   └── template-parser.js
├── data-schemas/
│   ├── clearance-rules.schema.json
│   ├── checklist-template.schema.json
│   ├── calculation-history.schema.json
│   └── storage-keys.json
└── constants/
    ├── default-values.js
    └── error-messages.js
```

### JavaScript Implementation

#### Core Mathematical Functions
```javascript
// techtools-core/math/imperial-conversion.js
export const ImperialConverter = {
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

  formatMeasurement(ft, inches) {
    return `${ft}'-${inches}"`;
  }
};
```

#### Business Logic Modules
```javascript
// techtools-core/business-logic/clearance-calculator.js
export const ClearanceCalculator = {
  checkCompliance(measuredFt, measuredIn, requiredFt, requiredIn) {
    const measuredTotal = ImperialConverter.toTotalInches(measuredFt, measuredIn);
    const requiredTotal = ImperialConverter.toTotalInches(requiredFt, requiredIn);
    const diff = measuredTotal - requiredTotal;
    
    return {
      pass: diff >= 0,
      difference: diff,
      margin: ImperialConverter.fromTotalInches(Math.abs(diff)),
      status: diff >= 0 ? 'Pass' : 'Fail'
    };
  },

  validateRule(rule) {
    return rule && 
           typeof rule.requiredFt === 'number' && 
           typeof rule.requiredIn === 'number' &&
           rule.requiredFt >= 0 && 
           rule.requiredIn >= 0;
  }
};
```

#### Input Validation
```javascript
// techtools-core/business-logic/input-validation.js
export const InputValidator = {
  parseNumber(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  validateMeasurement(ft, inches) {
    return {
      isValid: ft >= 0 && inches >= 0 && inches < 12,
      feet: this.parseNumber(ft),
      inches: this.parseNumber(inches)
    };
  },

  sanitizeInputArray(inputs) {
    return inputs.map(input => this.parseNumber(input.value));
  }
};
```

### Python Implementation (Desktop Equivalent)

```python
# techtools_core/math/imperial_conversion.py
class ImperialConverter:
    @staticmethod
    def to_total_inches(ft: int, inches: int) -> int:
        return ft * 12 + inches
    
    @staticmethod
    def from_total_inches(total: int) -> tuple[int, int]:
        sign = -1 if total < 0 else 1
        abs_val = abs(total)
        ft = (abs_val // 12) * sign
        inch = abs_val % 12
        return ft, inch
    
    @staticmethod
    def format_measurement(ft: int, inches: int) -> str:
        return f"{ft}'-{inches}\""
```

---

## 🔌 Platform Adapter Interfaces

### Storage Adapter Interface
```javascript
// Platform-agnostic storage interface
class StorageAdapter {
  async save(key, data) { throw new Error('Not implemented'); }
  async load(key, defaultValue = null) { throw new Error('Not implemented'); }
  async remove(key) { throw new Error('Not implemented'); }
  async export(data) { throw new Error('Not implemented'); }
  async import(source) { throw new Error('Not implemented'); }
}

// Web Implementation
class WebStorageAdapter extends StorageAdapter {
  async save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  async load(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (err) {
      return defaultValue;
    }
  }
}

// Desktop Implementation (Python equivalent)
class JSONFileStorageAdapter:
    def save(self, key: str, data: any) -> None:
        with open(f"data/{key}.json", 'w') as f:
            json.dump(data, f)
    
    def load(self, key: str, default_value=None):
        try:
            with open(f"data/{key}.json", 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return default_value
```

### Clipboard Adapter Interface
```javascript
// Platform-agnostic clipboard interface
class ClipboardAdapter {
  async copy(text) { throw new Error('Not implemented'); }
}

// Web Implementation
class WebClipboardAdapter extends ClipboardAdapter {
  async copy(text) {
    await navigator.clipboard.writeText(text);
  }
}

// Desktop Implementation (Python equivalent)
class TkinterClipboardAdapter:
    def __init__(self, root):
        self.root = root
    
    def copy(self, text: str) -> None:
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
```

---

## 📋 Implementation Strategy

### Phase 1: Core Library Creation
1. **Extract Mathematical Functions**
   - Create `techtools-core` module structure
   - Move imperial conversion functions to shared library
   - Implement sag calculation algorithms
   - Add comprehensive unit tests

2. **Business Logic Extraction**
   - Extract clearance calculation logic
   - Implement input validation functions
   - Create history management utilities
   - Add template parsing functions

3. **Data Schema Standardization**
   - Define JSON schemas for all data structures
   - Create validation functions for schemas
   - Document storage key conventions
   - Establish default configuration values

### Phase 2: Platform Integration
1. **Extension Integration**
   - Import core library into extension
   - Replace duplicated code with core functions
   - Implement web storage adapter
   - Test all existing functionality

2. **Web Application Integration**
   - Import core library into web app
   - Replace duplicated code with core functions
   - Implement web storage adapter
   - Ensure feature parity with extension

3. **Desktop Enhancement**
   - Create Python equivalent of core library
   - Implement missing tools (clearance calculators)
   - Add JSON file storage system
   - Implement proper history management

### Phase 3: Advanced Features
1. **Cross-Platform Data Sync**
   - Design sync protocol for shared data
   - Implement conflict resolution
   - Add import/export between platforms

2. **Enhanced Validation**
   - Add schema validation for all data
   - Implement comprehensive error handling
   - Add input sanitization

---

## 🧪 Testing Strategy

### Unit Testing
- **Core Library**: 100% test coverage for all mathematical functions
- **Business Logic**: Test all validation and calculation algorithms
- **Data Schemas**: Validate all JSON schema definitions
- **Platform Adapters**: Mock platform APIs for isolated testing

### Integration Testing
- **Cross-Platform Consistency**: Same inputs produce identical outputs
- **Data Migration**: Ensure data can move between platforms
- **Performance**: Benchmark calculation performance
- **Error Handling**: Test edge cases and invalid inputs

### End-to-End Testing
- **User Workflows**: Test complete calculation workflows
- **Data Persistence**: Verify data survives application restarts
- **Import/Export**: Test configuration sharing between platforms

---

## 📊 Expected Benefits

### Code Quality Improvements
- **Reduced Duplication**: ~60% reduction in duplicated calculation code
- **Centralized Logic**: Single source of truth for business rules
- **Enhanced Testing**: Comprehensive test coverage for core algorithms
- **Better Maintainability**: Changes in one location affect all platforms

### Feature Parity
- **Desktop Completion**: All 7 tools available on desktop
- **Consistent UX**: Identical behavior across all platforms
- **Data Portability**: Settings and templates shareable between platforms
- **Enhanced Reliability**: Robust error handling and validation

### Development Efficiency
- **Faster Feature Development**: New tools only need platform adapters
- **Easier Debugging**: Centralized logic simplifies troubleshooting
- **Consistent Updates**: Algorithm improvements benefit all platforms
- **Reduced Testing Overhead**: Core logic tested once, adapters tested separately

---

## 🚧 Implementation Risks & Mitigations

### Risk: Breaking Existing Functionality
**Mitigation**: Comprehensive regression testing, gradual migration approach

### Risk: Performance Impact from Abstraction
**Mitigation**: Performance benchmarking, optimize critical paths

### Risk: Increased Complexity
**Mitigation**: Clear documentation, simple adapter interfaces

### Risk: Platform-Specific Limitations
**Mitigation**: Flexible adapter pattern, platform-specific optimizations

---

## Next Steps

1. **Create Core Library Structure** (Next planning document)
2. **Define Platform Adapter Specifications**
3. **Plan Migration Strategy for Existing Code**
4. **Establish Testing Framework**
5. **Create Development Workflow Documentation**

---

*This architecture provides a scalable foundation for TechTools development while maintaining the unique advantages of each platform.*
