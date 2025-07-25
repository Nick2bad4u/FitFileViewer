/**
 * UI State Management Utilities
 * Specific utilities for managing UI state and interactions
 */

import { setState, getState, subscribe, updateState } from "../core/stateManager.js";
import { AppActions } from "../../app/lifecycle/appActions.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * UI State Manager - handles common UI state operations
 */
export class UIStateManager {
    constructor() {
        this.eventListeners = new Map();
        this.initialize();
    }

    /**
     * Initialize UI state management
     */
    initialize() {
        // Set up DOM event listeners for state synchronization
        this.setupEventListeners();

        // Initialize reactive UI elements
        this.initializeReactiveElements();

        console.log("[UIStateManager] Initialized");
    }

    /**
     * Set up DOM event listeners that sync with state
     */
    setupEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll("[data-tab]");
        tabButtons.forEach((button) => {
            const tabName = button.getAttribute("data-tab");
            button.addEventListener("click", () => {
                AppActions.switchTab(tabName);
            });
        });

        // Theme toggle buttons
        const themeButtons = document.querySelectorAll("[data-theme]");
        themeButtons.forEach((button) => {
            const theme = button.getAttribute("data-theme");
            button.addEventListener("click", () => {
                AppActions.switchTheme(theme);
            });
        });

        // Chart controls toggle
        const chartToggle = document.getElementById("chart-controls-toggle");
        if (chartToggle) {
            chartToggle.addEventListener("click", () => {
                AppActions.toggleChartControls();
            });
        }

        // Measurement mode toggle
        const measureToggle = document.getElementById("measurement-mode-toggle");
        if (measureToggle) {
            measureToggle.addEventListener("click", () => {
                AppActions.toggleMeasurementMode();
            });
        }
    }

    /**
     * Initialize reactive UI elements that respond to state changes
     */
    initializeReactiveElements() {
        // Subscribe to active tab changes
        subscribe("ui.activeTab", (activeTab) => {
            this.updateTabVisibility(activeTab);
            this.updateTabButtons(activeTab);
        });

        // Subscribe to theme changes
        subscribe("ui.theme", (theme) => {
            this.applyTheme(theme);
        });

        // Subscribe to loading state changes
        subscribe("isLoading", (isLoading) => {
            this.updateLoadingIndicator(isLoading);
        });

        // Subscribe to chart controls visibility
        subscribe("charts.controlsVisible", (isVisible) => {
            this.updateChartControlsUI(isVisible);
        });

        // Subscribe to measurement mode changes
        subscribe("map.measurementMode", (isActive) => {
            this.updateMeasurementModeUI(isActive);
        });
    }

    /**
     * Update tab visibility based on active tab
     * @param {string} activeTab - The currently active tab
     */
    updateTabVisibility(activeTab) {
        const tabContents = document.querySelectorAll(".tab-content");

        tabContents.forEach((content) => {
            const tabName = content.getAttribute("data-tab-content");
            const isActive = tabName === activeTab;

            content.style.display = isActive ? "block" : "none";
            content.setAttribute("aria-hidden", (!isActive).toString());
        });

        console.log(`[UIStateManager] Tab visibility updated: ${activeTab}`);
    }

    /**
     * Update tab button states
     * @param {string} activeTab - The currently active tab
     */
    updateTabButtons(activeTab) {
        const tabButtons = document.querySelectorAll("[data-tab]");

        tabButtons.forEach((button) => {
            const tabName = button.getAttribute("data-tab");
            const isActive = tabName === activeTab;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", isActive.toString());
        });
    }

    /**
     * Apply theme to the UI
     * @param {string} theme - Theme to apply ('light', 'dark', 'system')
     */
    applyTheme(theme) {
        const root = document.documentElement;

        if (theme === "system") {
            // Remove explicit theme and use system preference
            root.removeAttribute("data-theme");

            // Listen for system theme changes
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const systemTheme = mediaQuery.matches ? "dark" : "light";
            root.setAttribute("data-theme", systemTheme);

            // Update on system theme change
            if (!this.systemThemeListener) {
                this.systemThemeListener = (e) => {
                    const newSystemTheme = e.matches ? "dark" : "light";
                    root.setAttribute("data-theme", newSystemTheme);
                };
                mediaQuery.addEventListener("change", this.systemThemeListener);
            }
        } else {
            // Apply explicit theme
            root.setAttribute("data-theme", theme);

            // Remove system theme listener if it exists
            if (this.systemThemeListener) {
                const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
                mediaQuery.removeEventListener("change", this.systemThemeListener);
                this.systemThemeListener = null;
            }
        }

        // Update theme toggle buttons
        const themeButtons = document.querySelectorAll("[data-theme]");
        themeButtons.forEach((button) => {
            const buttonTheme = button.getAttribute("data-theme");
            button.classList.toggle("active", buttonTheme === theme);
        });

        console.log(`[UIStateManager] Theme applied: ${theme}`);
    }

    /**
     * Update loading indicator visibility
     * @param {boolean} isLoading - Whether the app is loading
     */
    updateLoadingIndicator(isLoading) {
        const loadingIndicator = document.getElementById("loading-indicator");
        const mainContent = document.getElementById("main-content");

        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? "block" : "none";
        }

        if (mainContent) {
            mainContent.style.opacity = isLoading ? "0.5" : "1";
            mainContent.style.pointerEvents = isLoading ? "none" : "auto";
        }

        // Update cursor
        document.body.style.cursor = isLoading ? "wait" : "default";
    }

    /**
     * Update chart controls UI
     * @param {boolean} isVisible - Whether controls are visible
     */
    updateChartControlsUI(isVisible) {
        const wrapper = document.getElementById("chartjs-settings-wrapper");
        const toggleBtn = document.getElementById("chart-controls-toggle");

        if (wrapper) {
            wrapper.style.display = isVisible ? "block" : "none";
        }

        if (toggleBtn) {
            toggleBtn.textContent = isVisible ? "▼ Hide Controls" : "▶ Show Controls";
            toggleBtn.setAttribute("aria-expanded", isVisible.toString());
        }
    } /**
     * Update measurement mode UI
     * @param {boolean} isActive - Whether measurement mode is active
     */
    updateMeasurementModeUI(isActive) {
        const toggleBtn = document.getElementById("measurement-mode-toggle");
        const mapContainer = document.getElementById("map-container");

        if (toggleBtn) {
            toggleBtn.classList.toggle("active", isActive);
            toggleBtn.textContent = isActive ? "Exit Measurement" : "Measure Distance";
        }

        if (mapContainer) {
            mapContainer.classList.toggle("measurement-mode", isActive);
        }
    } /**
     * Show a notification to the user
     * @param {Object|string} notification - Notification options or message string
     * @param {string} notification.message - Notification message
     * @param {string} notification.type - Notification type ('info', 'success', 'warning', 'error')
     * @param {number} notification.duration - Duration in milliseconds
     */
    showNotification(notification) {
        try {
            // Handle both object and string parameters for backward compatibility
            let message, type, duration;

            if (typeof notification === "string") {
                message = notification;
                type = "info";
                duration = 3000;
            } else if (typeof notification === "object" && notification !== null) {
                message = notification.message || "No message provided";
                type = notification.type || "info";
                duration = notification.duration || 3000;
            } else {
                console.warn("[UIStateManager] Invalid notification parameter:", notification);
                return;
            } // Use the imported showNotification utility
            try {
                showNotification(message, type, duration);
            } catch {
                // Fallback to console logging if notification system fails
                console.log(`[Notification ${type.toUpperCase()}] ${message}`);

                if (type === "error" || type === "warning") {
                    console.warn(`${type.toUpperCase()}: ${message}`);
                }
            }

            // Update state to track the last notification
            setState(
                "ui.lastNotification",
                {
                    message,
                    type,
                    timestamp: Date.now(),
                },
                { source: "UIStateManager.showNotification" }
            );
        } catch (error) {
            console.error("[UIStateManager] Failed to show notification:", error);
            console.log(`[Notification] ${notification.message || notification}`);
        }
    }

    /**
     * Show/hide sidebar
     * @param {boolean} collapsed - Whether sidebar should be collapsed
     */
    toggleSidebar(collapsed = null) {
        const currentState = getState("ui.sidebarCollapsed");
        const newState = collapsed !== null ? collapsed : !currentState;

        setState("ui.sidebarCollapsed", newState, { source: "UIStateManager.toggleSidebar" });

        const sidebar = document.getElementById("sidebar");
        const mainContent = document.getElementById("main-content");

        if (sidebar) {
            sidebar.classList.toggle("collapsed", newState);
        }

        if (mainContent) {
            mainContent.classList.toggle("sidebar-collapsed", newState);
        }
    }

    /**
     * Update window state from DOM
     */
    updateWindowStateFromDOM() {
        const windowState = {
            width: window.innerWidth,
            height: window.innerHeight,
            x: window.screenX,
            y: window.screenY,
            maximized: window.outerWidth === screen.availWidth && window.outerHeight === screen.availHeight,
        };

        updateState("ui.windowState", windowState, { source: "UIStateManager.updateWindowStateFromDOM" });
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        // Remove system theme listener if it exists
        if (this.systemThemeListener) {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            mediaQuery.removeEventListener("change", this.systemThemeListener);
        }

        // Clear custom event listeners
        this.eventListeners.clear();

        console.log("[UIStateManager] Cleaned up");
    }
}

/**
 * Global UI state manager instance
 */
export const uiStateManager = new UIStateManager();

/**
 * Convenience functions for common UI state operations
 */
export const UIActions = {
    /**
     * Show a tab
     * @param {string} tabName - Tab to show
     */
    showTab(tabName) {
        AppActions.switchTab(tabName);
    },

    /**
     * Toggle chart controls
     */
    toggleChartControls() {
        AppActions.toggleChartControls();
    },

    /**
     * Toggle measurement mode
     */
    toggleMeasurementMode() {
        AppActions.toggleMeasurementMode();
    },

    /**
     * Set theme
     * @param {string} theme - Theme to set
     */
    setTheme(theme) {
        AppActions.switchTheme(theme);
    },

    /**
     * Toggle sidebar
     * @param {boolean} collapsed - Whether to collapse
     */
    toggleSidebar(collapsed) {
        uiStateManager.toggleSidebar(collapsed);
    },

    /**
     * Update window state
     */
    updateWindowState() {
        uiStateManager.updateWindowStateFromDOM();
    },
};

// Set up window resize listener
window.addEventListener("resize", () => {
    UIActions.updateWindowState();
});

// Set up beforeunload to save state
window.addEventListener("beforeunload", () => {
    UIActions.updateWindowState();
});
