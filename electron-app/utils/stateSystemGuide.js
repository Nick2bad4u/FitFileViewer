/**
 * Integration Guide for FitFileViewer State System
 *
 * This file provides examples and instructions for integrating the new state system
 * into your existing FitFileViewer application.
 *
 * Note: This file contains example code snippets that may reference undefined variables.
 * This is intentional as they are meant to be copied and adapted to your specific implementation.
 */

/* eslint-disable no-undef, no-unused-vars */

/**
 * STEP 1: Update your renderer.js
 *
 * Replace the existing initialization in renderer.js with this pattern:
 */

// At the top of renderer.js, replace existing imports with:
/*
import { initializeFitFileViewerState, AppActions, AppSelectors, UIActions } from './utils/masterStateManager.js';
import { getState, setState, subscribe } from './utils/stateManager.js';
import { FitFileSelectors } from './utils/fitFileState.js';
*/

/**
 * STEP 2: Replace your existing DOMContentLoaded handler
 *
 * Replace your existing initialization with:
 */
/*
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Renderer] Starting FitFileViewer initialization...');
    
    try {
        // Initialize the complete state system
        await initializeFitFileViewerState();
        
        // Set up your existing event handlers using the new state system
        setupApplicationEventHandlers();
        
        // Initialize your existing UI components
        initializeUIComponents();
        
        console.log('[Renderer] FitFileViewer initialization completed');
        
    } catch (error) {
        console.error('[Renderer] Initialization failed:', error);
        // Handle initialization failure
    }
});
*/

/**
 * STEP 3: Convert existing file handling
 *
 * Replace existing file handling with state-based approach:
 */

// OLD WAY:
/*
function handleFileOpen(fileData, filePath) {
    window.globalData = fileData;
    updateUI();
    showTabs();
}
*/

// NEW WAY:
/*
function handleFileOpen(fileData, filePath) {
    // Use action to load file (automatically updates state and UI)
    AppActions.loadFile(fileData, filePath);
}
*/

/**
 * STEP 4: Convert tab switching
 *
 * Replace manual tab switching with state-based approach:
 */

// OLD WAY:
/*
function switchToChartTab() {
    updateActiveTab('chart-tab');
    updateTabVisibility('content-chartjs');
    renderChart();
}
*/

// NEW WAY:
/*
function switchToChartTab() {
    // Single action handles all the complexity
    AppActions.switchTab('chart');
}
*/

/**
 * STEP 5: Convert data checks
 *
 * Replace manual data checks with selectors:
 */

// OLD WAY:
/*
if (window.globalData && window.globalData.records) {
    enableButtons();
}
*/

// NEW WAY:
/*
if (AppSelectors.hasData()) {
    // Buttons are automatically enabled by state system
}
*/

/**
 * STEP 6: Add reactive UI updates
 *
 * Use subscriptions to make UI reactive:
 */
/*
function setupReactiveUI() {
    // React to data loading
    subscribe('globalData', (data) => {
        if (data) {
            console.log('New data loaded, UI will update automatically');
        }
    });
    
    // React to tab changes
    subscribe('ui.activeTab', (activeTab) => {
        console.log(`Switched to ${activeTab} tab`);
        // Additional tab-specific logic here
    });
    
    // React to loading state
    subscribe('isLoading', (isLoading) => {
        console.log(`Loading: ${isLoading}`);
        // Additional loading logic here
    });
}
*/

/**
 * STEP 7: Example of updated event handlers
 */
/*
function setupApplicationEventHandlers() {
    // File operations
    window.electronAPI?.onFileOpened((fileData, filePath) => {
        AppActions.loadFile(fileData, filePath);
    });
    
    // Tab button clicks (if not using automatic setup)
    document.getElementById('summary-tab')?.addEventListener('click', () => {
        AppActions.switchTab('summary');
    });
    
    document.getElementById('chart-tab')?.addEventListener('click', () => {
        AppActions.switchTab('chart');
    });
    
    document.getElementById('map-tab')?.addEventListener('click', () => {
        AppActions.switchTab('map');
    });
    
    document.getElementById('data-tab')?.addEventListener('click', () => {
        AppActions.switchTab('data');
    });
    
    // Theme switching
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const currentTheme = getState('ui.theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        UIActions.setTheme(newTheme);
    });
    
    // Chart controls
    document.getElementById('chart-controls-toggle')?.addEventListener('click', () => {
        UIActions.toggleChartControls();
    });
}
*/

/**
 * STEP 8: Migration of existing utilities
 *
 * Update your existing utility imports:
 */

// OLD WAY:
/*
import { updateActiveTab } from './utils/updateActiveTab.js';
import { updateTabVisibility } from './utils/updateTabVisibility.js';
import { setTabButtonsEnabled } from './utils/enableTabButtons.js';
*/

// NEW WAY:
/*
import { AppActions, UIActions } from './utils/masterStateManager.js';
// Then use AppActions.switchTab() instead of the individual functions
*/

/**
 * STEP 9: Debugging and monitoring
 *
 * Access state debugging tools:
 */
/*
// In development mode, you can access:
window.__state_debug.logState(); // Log current state
window.__state_debug.watchState('ui.activeTab'); // Watch specific state changes
window.__state_debug.triggerAction('switchTab', 'chart'); // Trigger actions
*/

/**
 * STEP 10: Gradual migration approach
 *
 * You can migrate gradually by:
 * 1. Initialize the state system
 * 2. Keep existing code working alongside new state code
 * 3. Gradually replace old patterns with new state-based patterns
 * 4. Remove old code once everything is migrated
 */

export const migrationExamples = {
    /**
     * Example: Migrate chart rendering
     */
    migrateChartRendering() {
        // OLD: Direct function call
        // renderChart(data, options);
        // NEW: Use action
        // AppActions.renderChart(data, options);
        // The action will:
        // - Update state
        // - Trigger chart rendering
        // - Update performance metrics
        // - Handle errors
        // - Notify other components
    },

    /**
     * Example: Migrate loading state
     */
    migrateLoadingState() {
        // OLD: Manual DOM manipulation
        // document.getElementById('loading').style.display = 'block';
        // document.body.style.cursor = 'wait';
        // NEW: Use state
        // setState('isLoading', true);
        // All loading UI updates happen automatically
    },

    /**
     * Example: Migrate theme switching
     */
    migrateThemeSwitch() {
        // OLD: Manual theme application
        // document.documentElement.setAttribute('data-theme', 'dark');
        // localStorage.setItem('theme', 'dark');
        // updateMapTheme('dark');
        // updateChartTheme('dark');
        // NEW: Single action
        // UIActions.setTheme('dark');
        // Automatically updates DOM, saves to localStorage, and notifies all components
    },
};

/**
 * Common Patterns and Best Practices
 */
export const bestPractices = {
    /**
     * DO: Use actions for state changes
     */
    useActions() {
        // Good
        AppActions.loadFile(data, path);
        UIActions.setTheme("dark");

        // Avoid direct state manipulation
        // setState('globalData', data); // Use actions instead
    },

    /**
     * DO: Use selectors for state reading
     */
    useSelectors() {
        // Good
        if (AppSelectors.hasData()) {
            renderComponents();
        }

        // Avoid direct state access
        // if (getState('globalData')) { ... } // Use selectors instead
    },

    /**
     * DO: Use subscriptions for reactive updates
     */
    useSubscriptions() {
        // Good
        subscribe("ui.activeTab", (tab) => {
            updateSpecificTabLogic(tab);
        });

        // Remember to clean up subscriptions when components unmount
        const unsubscribe = subscribe("someState", callback);
        // Later: unsubscribe();
    },

    /**
     * DO: Handle errors in state operations
     */
    handleErrors() {
        try {
            AppActions.loadFile(data, path);
        } catch (error) {
            console.error("Failed to load file:", error);
            // Handle error appropriately
        }
    },
};

console.log("State system integration guide loaded. See migrationExamples and bestPractices for usage patterns.");
