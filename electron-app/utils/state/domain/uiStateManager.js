/**
 * UI State Management Utilities
 * Specific utilities for managing UI state and interactions
 */

import { getState, setState, subscribe, updateState } from "../core/stateManager.js";
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
        // Safe helpers to guard against jsdom brand-check errors or replaced globals
        /**
         * @param {string} selector
         * @returns {Element[]}
         */
        const safeQuerySelectorAll = (selector) => {
            try {
                const doc = /** @type {Document} */ (document);
                if (doc && typeof doc.querySelectorAll === "function") {
                    // Array.from guards non-iterables
                    return /** @type {Element[]} */ (Array.from(doc.querySelectorAll(selector) || []));
                }
            } catch (e) {
                // Swallow to keep tests stable if document was swapped or methods are from another realm
            }
            return [];
        };
        /**
         * @param {string} id
         * @returns {HTMLElement|null}
         */
        const safeGetById = (id) => {
            try {
                return /** @type {HTMLElement|null} */ (document.getElementById(id));
            } catch {
                return null;
            }
        };

        // Tab switching
        const tabButtons = safeQuerySelectorAll("[data-tab]");
        tabButtons.forEach((button) => {
            const tabName = button.getAttribute("data-tab");
            button.addEventListener("click", () => {
                if (tabName) {
                    AppActions.switchTab(tabName);
                }
            });
        });

        // Theme toggle buttons
        const themeButtons = safeQuerySelectorAll("[data-theme]");
        themeButtons.forEach((button) => {
            const theme = button.getAttribute("data-theme");
            button.addEventListener("click", () => {
                if (theme) {
                    AppActions.switchTheme(theme);
                }
            });
        });

        // Chart controls toggle
        const chartToggle = safeGetById("chart-controls-toggle");
        if (chartToggle) {
            chartToggle.addEventListener("click", () => {
                AppActions.toggleChartControls();
            });
        }

        // Measurement mode toggle
        const measureToggle = safeGetById("measurement-mode-toggle");
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
        subscribe("ui.activeTab", (/** @type {*} */ activeTab) => {
            this.updateTabVisibility(activeTab);
            this.updateTabButtons(activeTab);
        });

        // Subscribe to theme changes
        subscribe("ui.theme", (/** @type {*} */ theme) => {
            this.applyTheme(theme);
        });

        // Subscribe to loading state changes
        subscribe("isLoading", (/** @type {*} */ isLoading) => {
            this.updateLoadingIndicator(isLoading);
        });

        // Subscribe to chart controls visibility
        subscribe("charts.controlsVisible", (/** @type {*} */ isVisible) => {
            this.updateChartControlsUI(isVisible);
        });

        // Subscribe to measurement mode changes
        subscribe("map.measurementMode", (/** @type {*} */ isActive) => {
            this.updateMeasurementModeUI(isActive);
        });
    }

    /**
     * Update tab visibility based on active tab
     * @param {string} activeTab - The currently active tab
     */
    updateTabVisibility(activeTab) {
        /**
         * @param {string} selector
         * @returns {Element[]}
         */
        const safeQuerySelectorAll = (selector) => {
            try {
                const doc = /** @type {Document} */ (document);
                if (doc && typeof doc.querySelectorAll === "function") {
                    return /** @type {Element[]} */ (Array.from(doc.querySelectorAll(selector) || []));
                }
            } catch {}
            return [];
        };
        const tabContents = safeQuerySelectorAll(".tab-content");

        tabContents.forEach((content) => {
            const tabName = content.getAttribute("data-tab-content"),
             isActive = tabName === activeTab;

            /** @type {HTMLElement} */ (content).style.display = isActive ? "block" : "none";
            content.setAttribute("aria-hidden", (!isActive).toString());
        });

        console.log(`[UIStateManager] Tab visibility updated: ${activeTab}`);
    }

    /**
     * Update tab button states
     * @param {string} activeTab - The currently active tab
     */
    updateTabButtons(activeTab) {
        /**
         * @param {string} selector
         * @returns {Element[]}
         */
        const safeQuerySelectorAll = (selector) => {
            try {
                const doc = /** @type {Document} */ (document);
                if (doc && typeof doc.querySelectorAll === "function") {
                    return /** @type {Element[]} */ (Array.from(doc.querySelectorAll(selector) || []));
                }
            } catch {}
            return [];
        };
        const tabButtons = safeQuerySelectorAll("[data-tab]");

        tabButtons.forEach((button) => {
            const tabName = button.getAttribute("data-tab"),
             isActive = tabName === activeTab;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", isActive.toString());
        });
    }

    /**
     * Apply theme to the UI
     * @param {string} theme - Theme to apply ('light', 'dark', 'system')
     */
    applyTheme(theme) {
        const root = /** @type {HTMLElement} */ (document.documentElement || document.body || /** @type {any} */ ({}));

        if (theme === "system") {
            // Remove explicit theme and use system preference
            root.removeAttribute("data-theme");

            // Listen for system theme changes if supported
            if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
                const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)"),
                 systemTheme = mediaQuery.matches ? "dark" : "light";
                root.setAttribute("data-theme", systemTheme);

                // Update on system theme change
                if (!this.systemThemeListener) {
                    this.systemThemeListener = (/** @type {*} */ e) => {
                        const newSystemTheme = e.matches ? "dark" : "light";
                        root.setAttribute("data-theme", newSystemTheme);
                    };
                    if (typeof mediaQuery.addEventListener === "function") {
                        mediaQuery.addEventListener("change", this.systemThemeListener);
                    } else if (typeof mediaQuery.addListener === "function") {
                        // Older API fallback
                        mediaQuery.addListener(this.systemThemeListener);
                    }
                }
            } else {
                // Fallback when matchMedia is not available (e.g., jsdom)
                root.setAttribute("data-theme", "light");
            }
        } else {
            // Apply explicit theme
            root.setAttribute("data-theme", theme);

            // Remove system theme listener if it exists
            if (this.systemThemeListener) {
                if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
                    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
                    if (typeof mediaQuery.removeEventListener === "function") {
                        mediaQuery.removeEventListener("change", this.systemThemeListener);
                    } else if (typeof mediaQuery.removeListener === "function") {
                        mediaQuery.removeListener(this.systemThemeListener);
                    }
                }
                this.systemThemeListener = null;
            }
        }

        // Update theme toggle buttons
        const themeButtons = (() => {
            try {
                return /** @type {Element[]} */ (Array.from(document.querySelectorAll("[data-theme]") || []));
            } catch { return []; }
        })();
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
        const loadingIndicator = (() => { try { return document.getElementById("loading-indicator"); } catch { return null; }})();
        const mainContent = (() => { try { return document.getElementById("main-content"); } catch { return null; }})();

        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? "block" : "none";
        }

        if (mainContent) {
            mainContent.style.opacity = isLoading ? "0.5" : "1";
            mainContent.style.pointerEvents = isLoading ? "none" : "auto";
        }

        // Update cursor
        try {
            document.body.style.cursor = isLoading ? "wait" : "default";
        } catch {}
    }

    /**
     * Update chart controls UI
     * @param {boolean} isVisible - Whether controls are visible
     */
    updateChartControlsUI(isVisible) {
        const wrapper = (() => { try { return document.getElementById("chartjs-settings-wrapper"); } catch { return null; }})();
        const toggleBtn = (() => { try { return document.getElementById("chart-controls-toggle"); } catch { return null; }})();

        if (wrapper) {
            wrapper.style.display = isVisible ? "block" : "none";
        }

        if (toggleBtn) {
            toggleBtn.textContent = isVisible ? "▼ Hide Controls" : "▶ Show Controls";
            toggleBtn.setAttribute("aria-expanded", isVisible.toString());
        }
    }
    /**
     * Update measurement mode UI
     * @param {*} isActive - Whether measurement mode is active
     */
    updateMeasurementModeUI(isActive) {
        const toggleBtn = (() => { try { return document.getElementById("measurement-mode-toggle"); } catch { return null; }})();
        const mapContainer = (() => { try { return document.getElementById("map-container"); } catch { return null; }})();

        if (toggleBtn) {
            toggleBtn.classList.toggle("active", isActive);
            toggleBtn.textContent = isActive ? "Exit Measurement" : "Measure Distance";
        }

        if (mapContainer) {
            mapContainer.classList.toggle("measurement-mode", isActive);
        }
    }
    /**
     * Show a notification to the user
     * @param {*} notification - Notification options or message string
     */
    showNotification(notification) {
        try {
            // Handle both object and string parameters for backward compatibility
            let duration, message, type;

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
     * @param {*} collapsed - Whether sidebar should be collapsed
     */
    toggleSidebar(collapsed = undefined) {
        const currentState = getState("ui.sidebarCollapsed"),
         newState = collapsed !== undefined ? collapsed : !currentState;

        setState("ui.sidebarCollapsed", newState, { source: "UIStateManager.toggleSidebar" });

        const sidebar = document.getElementById("sidebar"),
         mainContent = document.getElementById("main-content");

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
