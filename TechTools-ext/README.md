# TechTools Chrome Extension

A comprehensive productivity toolkit designed specifically for TechServ professionals, providing instant access to essential calculation and productivity tools directly within your browser.

## Overview

The TechTools Chrome Extension delivers specialized engineering and technical tools through a clean, efficient popup interface. Built with Manifest V3 for modern Chrome compatibility, it offers offline functionality and seamless integration with your browser workflow.

## Primary Objectives

### Core Mission
Provide TechServ professionals with **instant access** to essential calculation and productivity tools directly within their browser workflow, without disrupting their current tasks.

### Key Goals
- **Quick Access**: All tools available via single browser action click
- **Minimal Disruption**: Popup interface that doesn't interfere with current webpage
- **Professional Focus**: Specialized tools tailored for technical/engineering work
- **Data Persistence**: Automatic saving of user data and preferences locally
- **Seamless Integration**: Copy-to-clipboard functionality for easy result sharing
- **Offline Capability**: Full functionality without network connectivity required

## Features

### Available Tools

#### 📐 **Feet & Inches Calculator**
- Perform arithmetic operations with imperial measurements
- Sequential input navigation for efficiency
- Calculation history with click-to-copy results
- Supports both addition and subtraction operations

#### 📝 **QuiC Note**
- Rich text editor with formatting capabilities (bold, italic, underline)
- Bulleted and numbered list support
- Auto-save functionality using localStorage
- Copy entire note content to clipboard

#### 📊 **Sag Calculator**
- Engineering calculations for fiber optic installations
- Computes sag factor and midspan fiber positioning
- Handles complex neutral and proposed fiber measurements
- Professional-grade accuracy for field work

#### ✅ **Design/QC Checklist**
- Template-based checklist management system
- Section headers with ### prefix for organization
- JSON import/export functionality for template sharing
- Copy results as formatted text or structured JSON

#### ⚡ **Clearance Calculators** (3 specialized tools)
- **Ground to Communication (GND2COM)**: Minimum 15'-6" clearance validation
- **Ground to Power (GND2PWR)**: Minimum 18'-0" clearance validation  
- **Bolt Hole Clearance**: Supply separation (40") and communication gaps (12")
- Pass/fail analysis with margin calculations
- Customizable rules with import/export settings

### Technical Features
- **Search Functionality**: Quickly locate tools by name
- **Tile-based Interface**: Visual tool selection with icons
- **Sequential Navigation**: Tab through inputs efficiently
- **Local Storage**: Persistent data across browser sessions
- **Clipboard Integration**: One-click copying of results
- **Responsive Design**: Clean, professional appearance

## Installation

### From Chrome Web Store
*[Installation instructions will be added when published]*

### Manual Installation (Development)
1. Download or clone the TechTools-ext folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the TechTools-ext folder
5. The extension icon will appear in your browser toolbar

## Usage

### Getting Started
1. Click the TechTools icon in your Chrome toolbar
2. Browse available tools using the tile interface
3. Use the search bar to quickly find specific tools
4. Click any tool tile to open its interface

### Navigation
- **Back Button**: Return to main tool selection screen
- **Search**: Type to filter tools by name
- **Enter Key**: Navigate through form inputs sequentially
- **Click Results**: Copy calculation results to clipboard

### Data Management
- All tool data is saved automatically to your local browser storage
- Calculation history is maintained across sessions
- Clearance calculator settings can be exported/imported as JSON
- Checklist templates can be shared via JSON export

## Technical Specifications

### Browser Compatibility
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Minimum Chrome Version**: 88+
- **Permissions**: 
  - `clipboardWrite` - Copy results to clipboard
  - `storage` - Save user data and preferences

### File Structure
```
TechTools-ext/
├── manifest.json          # Extension configuration
├── popup/
│   ├── index.html         # Main popup interface
│   ├── app.js            # Core application logic
│   └── styles.css        # Interface styling
└── icons/                # Tool and extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon128.png
    └── [tool-specific icons]
```

### Technologies Used
- **JavaScript**: Modern ES6+ features
- **HTML5**: Semantic markup
- **CSS3**: Custom properties, flexbox, grid
- **Chrome Extension APIs**: Storage, clipboard integration

## Target Users

### Primary Audience
Technical professionals working in:
- Telecommunications infrastructure
- Fiber optic installations  
- Electrical engineering
- Construction and utilities
- Quality control and inspection

### Use Cases
- **Field Calculations**: Quick measurements and conversions during site work
- **Design Review**: Clearance validation and compliance checking
- **Documentation**: Note-taking and checklist completion
- **Quality Assurance**: Systematic review processes using templates

## Development Notes

### Code Organization
- Modular tool architecture for easy expansion
- Consistent naming conventions across all tools
- Shared utility functions for common operations
- Event-driven interface with proper cleanup

### Extension Features
- Offline-first design - no network connectivity required
- Lightweight footprint with fast load times
- Accessible interface with keyboard navigation support
- Professional styling with SARIA and NEUTRON fonts

## Future Enhancements

- Additional specialized calculators
- Enhanced template sharing capabilities
- Integration with cloud storage services
- Mobile-responsive design improvements
- Advanced calculation history features

---

*For technical support or feature requests, please refer to the main TechTools project documentation.*
