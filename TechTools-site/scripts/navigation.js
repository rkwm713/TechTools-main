// TechTools Navigation System
// Handles sidebar navigation, tool switching, and app state management

window.TechTools = window.TechTools || {};

window.TechTools.Navigation = {
  // DOM elements
  sidebar: null,
  sidebarOverlay: null,
  hamburgerBtn: null,
  toolContent: null,
  toolTitle: null,
  toolActions: null,
  searchInput: null,
  recentToolsList: null,
  
  // Application state
  currentTool: null,
  recentTools: [],
  sidebarOpen: false,
  
  // Available tools configuration
  tools: {
    'fi-calculator': {
      id: 'fi-calculator',
      name: 'Feet & Inches',
      icon: 'icons/fi.png',
      category: 'Calculators',
      shortcut: '1',
      build: null // Will be set by calculators.js
    },
    'sag-calculator': {
      id: 'sag-calculator',
      name: 'Sag Calculator',
      icon: 'icons/sag.png',
      category: 'Calculators',
      shortcut: '2',
      build: null // Will be set by calculators.js
    },
    'clearance-tools': {
      id: 'clearance-tools',
      name: 'Smart Clearance Analyzer',
      icon: 'icons/gndcom.png',
      category: 'Clearances',
      shortcut: '3',
      build: null // Will be set by unified-clearance.js
    },
    'quic-note': {
      id: 'quic-note',
      name: 'QuiC Note',
      icon: 'icons/note.png',
      category: 'Productivity',
      shortcut: '4',
      build: null // Will be set by productivity-tools.js
    },
    'qc-checklist': {
      id: 'qc-checklist',
      name: 'Design/QC',
      icon: 'icons/checklist.png',
      category: 'Productivity',
      shortcut: '5',
      build: null // Will be set by productivity-tools.js
    }
  },
  
  // Initialize navigation system
  initialize() {
    // Get DOM elements
    this.sidebar = document.getElementById('sidebar');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.hamburgerBtn = document.getElementById('hamburgerBtn');
    this.toolContent = document.getElementById('toolContent');
    this.toolTitle = document.getElementById('toolTitle');
    this.toolActions = document.getElementById('toolActions');
    this.searchInput = document.getElementById('searchInput');
    this.recentToolsList = document.getElementById('recentToolsList');
    
    // Load recent tools from storage
    this.recentTools = window.TechTools.Storage.load('recentTools', []);
    
    this.setupEventListeners();
    this.updateRecentToolsList();
    
    console.log('🧭 Navigation system initialized');
  },
  
  // Setup all event listeners
  setupEventListeners() {
    // Tool navigation items
    document.querySelectorAll('.tool-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const toolId = item.dataset.tool;
        if (toolId && this.tools[toolId]) {
          this.openTool(toolId);
        }
      });
    });
    
    // Mobile hamburger menu
    if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener('click', () => this.toggleSidebar());
    }
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
    }
    
    // Search functionality
    let searchTimeout;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filterTools(e.target.value);
      }, 300);
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  },
  
  // Open a tool by ID
  openTool(toolId) {
    const tool = this.tools[toolId];
    if (!tool || !tool.build) {
      console.error(`Tool ${toolId} not found or not properly registered`);
      return;
    }
    
    // Update navigation state
    document.querySelectorAll('.tool-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-tool="${toolId}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }
    
    // Update current tool
    this.currentTool = toolId;
    
    // Update recent tools
    this.addToRecentTools(tool);
    
    // Update tool header
    this.toolTitle.textContent = tool.name;
    this.toolActions.innerHTML = ''; // Clear previous actions
    
    // Clear and rebuild tool content
    this.toolContent.innerHTML = '';
    
    // Build the tool
    try {
      tool.build();
    } catch (error) {
      console.error('Failed to build tool:', error);
      window.TechTools.UI.showAlert(`Failed to load ${tool.name}`, 'error');
      return;
    }
    
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
    
    // Scroll to top
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  },
  
  // Register a tool builder function
  registerTool(toolId, buildFunction) {
    if (this.tools[toolId]) {
      this.tools[toolId].build = buildFunction;
      console.log(`🔧 Tool registered: ${toolId}`);
    } else {
      console.warn(`Unknown tool ID: ${toolId}`);
    }
  },
  
  // Toggle sidebar visibility
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebar.classList.toggle('open', this.sidebarOpen);
    this.sidebarOverlay.classList.toggle('show', this.sidebarOpen);
    this.hamburgerBtn.classList.toggle('active', this.sidebarOpen);
  },
  
  // Close sidebar
  closeSidebar() {
    this.sidebarOpen = false;
    this.sidebar.classList.remove('open');
    this.sidebarOverlay.classList.remove('show');
    this.hamburgerBtn.classList.remove('active');
  },
  
  // Filter tools by search term
  filterTools(searchTerm) {
    if (!searchTerm.trim()) {
      // Show all tools
      document.querySelectorAll('.tool-nav-item').forEach(item => {
        item.style.display = 'flex';
      });
      return;
    }
    
    const term = searchTerm.toLowerCase();
    document.querySelectorAll('.tool-nav-item').forEach(item => {
      const toolId = item.dataset.tool;
      const tool = this.tools[toolId];
      const matches = tool && tool.name.toLowerCase().includes(term);
      item.style.display = matches ? 'flex' : 'none';
    });
  },
  
  // Handle global keyboard shortcuts
  handleKeyboardShortcuts(e) {
    // Don't intercept if user is typing in an input
    if (e.target.matches('input, textarea, [contenteditable]')) {
      return;
    }
    
    // Ctrl+K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.searchInput.focus();
      return;
    }
    
    // Number keys 1-5 for direct tool access
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        const toolIds = Object.keys(this.tools);
        if (toolIds[num - 1]) {
          this.openTool(toolIds[num - 1]);
        }
      }
    }
  },
  
  // Add tool to recent tools list
  addToRecentTools(tool) {
    // Remove if already exists
    this.recentTools = this.recentTools.filter(t => t.id !== tool.id);
    
    // Add to front
    this.recentTools.unshift({
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      timestamp: Date.now()
    });
    
    // Keep only last 3
    if (this.recentTools.length > 3) {
      this.recentTools = this.recentTools.slice(0, 3);
    }
    
    // Save and update UI
    window.TechTools.Storage.save('recentTools', this.recentTools);
    this.updateRecentToolsList();
  },
  
  // Update recent tools display
  updateRecentToolsList() {
    if (!this.recentToolsList) return;
    
    this.recentToolsList.innerHTML = '';
    
    if (this.recentTools.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'recent-tool-item';
      emptyMsg.style.fontStyle = 'italic';
      emptyMsg.style.color = '#999';
      emptyMsg.style.cursor = 'default';
      emptyMsg.textContent = 'No recent tools';
      this.recentToolsList.appendChild(emptyMsg);
      return;
    }
    
    this.recentTools.forEach(tool => {
      const button = document.createElement('button');
      button.className = 'recent-tool-item';
      button.innerHTML = `
        <img src="${tool.icon}" alt="${tool.name} icon" class="tool-icon" />
        <span>${tool.name}</span>
      `;
      button.addEventListener('click', () => this.openTool(tool.id));
      this.recentToolsList.appendChild(button);
    });
  }
};

console.log('🧭 TechTools Navigation system loaded');