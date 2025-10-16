/**
 * UI State Management Utilities
 * Specific utilities for managing UI state and interactions
 */

import { AppActions, normalizeTabName } from "../../app/lifecycle/appActions.js";
import { setThemePreference, THEME_MODES } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { getState, setState, subscribe, updateState } from "../core/stateManager.js";

const DEFAULT_DOCUMENT_TITLE = typeof document !== "undefined" && document?.title ? document.title : "Fit File Viewer";
const ICON_DOWN = '<iconify-icon icon="flat-color-icons:down" width="18" height="18"></iconify-icon>';
const ICON_RIGHT = '<iconify-icon icon="flat-color-icons:right" width="18" height="18"></iconify-icon>';

/**
 * UI State Manager - handles common UI state operations
 */
export class UIStateManager {
    constructor() {
        this.eventListeners = new Map();
        this.initialize();
    }

    /**
     * Apply theme to the UI
     * @param {string} theme - Theme to apply ('light', 'dark', 'auto' | legacy 'system')
     */
    applyTheme(theme) {
        const normalizedTheme = (() => {
            if (theme === "system") {
                return THEME_MODES.AUTO;
            }
            if (typeof theme === "string" && Object.values(THEME_MODES).includes(theme)) {
                return theme;
            }
            return THEME_MODES.AUTO;
        })();

        // Check if the theme is actually applied to the DOM, not just the state
        // This allows theme changes even when state value hasn't changed yet
        const currentTheme = getState("ui.theme");
        const isAlreadyApplied = currentTheme === normalizedTheme &&
            (document.body?.classList.contains(`theme-${normalizedTheme}`) ||
                (normalizedTheme === THEME_MODES.AUTO &&
                    (document.body?.classList.contains('theme-dark') || document.body?.classList.contains('theme-light'))));

        if (isAlreadyApplied) {
            return;
        }

        setThemePreference(normalizedTheme, { withTransition: false });

        // Update theme toggle buttons
        const themeButtons = (() => {
            try {
                return /** @type {Element[]} */ ([...(document.querySelectorAll("[data-theme]") || [])]);
            } catch {
                return [];
            }
        })();
        for (const button of themeButtons) {
            const buttonTheme = button.dataset.theme === "system" ? THEME_MODES.AUTO : button.dataset.theme;
            const isActive = buttonTheme === normalizedTheme;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        }

        console.log(`[UIStateManager] Theme applied: ${normalizedTheme}`);
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        // Remove system theme listener if it exists
        if (this.systemThemeListener) {
            const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
            mediaQuery.removeEventListener("change", this.systemThemeListener);
        }

        // Clear custom event listeners
        this.eventListeners.clear();

        console.log("[UIStateManager] Cleaned up");
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

        // Subscribe to unload button visibility
        subscribe("ui.unloadButtonVisible", (/** @type {*} */ isVisible) => {
            this.updateUnloadButtonVisibility(Boolean(isVisible));
        });

        // Subscribe to file display updates
        subscribe("ui.fileInfo", (/** @type {*} */ fileInfo) => {
            this.updateFileDisplayUI(fileInfo);
        });

        // Subscribe to loading indicator progress
        subscribe("ui.loadingIndicator", (/** @type {*} */ indicator) => {
            this.updateLoadingProgressUI(indicator);
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

        // Subscribe to drop overlay visibility changes
        subscribe("ui.dropOverlay.visible", (/** @type {*} */ isVisible) => {
            this.updateDropOverlayVisibility(Boolean(isVisible));
        });

        // Apply persisted states on startup
        this.updateUnloadButtonVisibility(Boolean(getState("ui.unloadButtonVisible")));
        this.updateFileDisplayUI(getState("ui.fileInfo"));
        this.updateLoadingProgressUI(getState("ui.loadingIndicator"));
        this.updateLoadingIndicator(Boolean(getState("isLoading")));
        this.updateDropOverlayVisibility(Boolean(getState("ui.dropOverlay.visible")));
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
                    return /** @type {Element[]} */ ([...(doc.querySelectorAll(selector) || [])]);
                }
            } catch {
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
        for (const button of tabButtons) {
            const tabName = button.dataset.tab;
            button.addEventListener("click", () => {
                if (tabName) {
                    AppActions.switchTab(tabName);
                }
            });
        }

        // Theme toggle buttons
        const themeButtons = safeQuerySelectorAll("[data-theme]");
        for (const button of themeButtons) {
            const { theme } = button.dataset;
            button.addEventListener("click", () => {
                if (theme) {
                    AppActions.switchTheme(theme);
                }
            });
        }

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
                    timestamp: Date.now(),
                    type,
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
    toggleSidebar(collapsed) {
        const currentState = getState("ui.sidebarCollapsed"),
            newState = collapsed === undefined ? !currentState : collapsed;

        setState("ui.sidebarCollapsed", newState, { source: "UIStateManager.toggleSidebar" });

        const mainContent = document.querySelector("#main-content"),
            sidebar = document.querySelector("#sidebar");

        if (sidebar) {
            sidebar.classList.toggle("collapsed", newState);
        }

        if (mainContent) {
            mainContent.classList.toggle("sidebar-collapsed", newState);
        }
    }

    /**
     * Update chart controls UI
     * @param {boolean} isVisible - Whether controls are visible
     */
    updateChartControlsUI(isVisible) {
        const wrapper = (() => {
            try {
                return document.querySelector("#chartjs-settings-wrapper");
            } catch {
                return null;
            }
        })();
        const toggleBtn = (() => {
            try {
                return document.querySelector("#chart-controls-toggle");
            } catch {
                return null;
            }
        })();

        if (wrapper) {
            wrapper.style.display = isVisible ? "block" : "none";
        }

        if (toggleBtn) {
            toggleBtn.innerHTML = isVisible ? `${ICON_DOWN} Hide Controls` : `${ICON_RIGHT} Show Controls`;
            toggleBtn.setAttribute("aria-expanded", isVisible.toString());
        }
    }
    /**
     * Update drop overlay visibility and related iframe pointer state
     * @param {boolean} isVisible - Whether the drop overlay should be shown
     */
    updateDropOverlayVisibility(isVisible) {
        const dropOverlay = (() => {
            try {
                return /** @type {HTMLElement|null} */ (document.getElementById("drop-overlay"));
            } catch {
                return null;
            }
        })();

        if (dropOverlay) {
            dropOverlay.style.display = isVisible ? "flex" : "none";
        }

        const altFitIframe = (() => {
            try {
                return /** @type {HTMLElement|null} */ (document.getElementById("altfit-iframe"));
            } catch {
                return null;
            }
        })();

        if (altFitIframe) {
            altFitIframe.style.pointerEvents = isVisible ? "none" : "";
        }

        const zwiftIframe = (() => {
            try {
                return /** @type {HTMLElement|null} */ (document.getElementById("zwift-iframe"));
            } catch {
                return null;
            }
        })();

        if (zwiftIframe) {
            zwiftIframe.style.pointerEvents = isVisible ? "none" : "";
        }
    }
    /**
     * Update active file display elements based on state
     * @param {{displayName?: string, hasFile?: boolean, title?: string}|null} fileInfo - File info state
     */
    updateFileDisplayUI(fileInfo) {
        const info = fileInfo || {},
            requestedHasFile = Boolean(info.hasFile),
            displayName = typeof info.displayName === "string" ? info.displayName : "",
            title =
                typeof info.title === "string" && info.title.trim().length > 0 ? info.title : DEFAULT_DOCUMENT_TITLE,
            globalData = getState("globalData"),
            hasRenderableFile = Boolean(requestedHasFile && displayName && globalData);

        const fileNameContainer = (() => {
            try {
                return document.getElementById("activeFileNameContainer");
            } catch {
                return null;
            }
        })();
        if (fileNameContainer) {
            fileNameContainer.classList.toggle("has-file", hasRenderableFile);
        }

        if (typeof document !== "undefined" && document.body) {
            const { body } = document,
                { classList, dataset } = body,
                hasToggle = Boolean(classList && typeof classList.toggle === "function");

            if (hasToggle) {
                classList.toggle("app-has-file", hasRenderableFile);
            } else {
                const { className = "" } = body,
                    classes = typeof className === "string" ? className.split(/\s+/) : [],
                    filtered = classes.filter((cls) => cls && cls !== "app-has-file");
                if (hasRenderableFile) {
                    filtered.push("app-has-file");
                }
                body.className = filtered.join(" ").trim();
            }

            if (dataset) {
                dataset.hasFitFile = hasRenderableFile ? "true" : "false";
            }
        }

        const fileSpan = (() => {
            try {
                return document.getElementById("activeFileName");
            } catch {
                return null;
            }
        })();

        if (fileSpan) {
            if (hasRenderableFile) {
                fileSpan.innerHTML = `<span class="active-label">Active:</span> <span class="filename-text">${displayName}</span>`;
                fileSpan.title = `Click to return to map - ${displayName}`;
                fileSpan.classList.remove("marquee");
                fileSpan.scrollLeft = 0;

                // Add click handler to return to map tab with centered route
                fileSpan.style.cursor = "pointer";
                fileSpan.onclick = () => {
                    try {
                        // Switch to map tab
                        setState("ui.activeTab", "map", { source: "filename-click" });

                        // Center the route on the map if possible
                        setTimeout(() => {
                            if (typeof globalThis.centerMapOnRoute === "function") {
                                globalThis.centerMapOnRoute();
                            } else if (typeof globalThis.fitBounds === "function") {
                                globalThis.fitBounds();
                            }
                        }, 100);
                    } catch (error) {
                        console.error("[UIStateManager] Error handling filename click:", error);
                    }
                };
            } else {
                fileSpan.textContent = "";
                fileSpan.title = "";
                fileSpan.classList.remove("marquee");
                fileSpan.style.cursor = "";
                fileSpan.onclick = null;
            }
        }

        try {
            document.title = title;
        } catch {
            /* Ignore errors */
        }
    }
    /**
     * Update loading indicator visibility
     * @param {boolean} isLoading - Whether the app is loading
     */
    updateLoadingIndicator(isLoading) {
        const loadingIndicator = (() => {
            try {
                return document.querySelector("#loading-indicator");
            } catch {
                return null;
            }
        })();
        const mainContent = (() => {
            try {
                return document.querySelector("#main-content");
            } catch {
                return null;
            }
        })();

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
        } catch {
            /* Ignore errors */
        }
    }
    /**
     * Update loading progress UI based on indicator state
     * @param {{progress?: number, active?: boolean}|null} indicator - Loading indicator state
     */
    updateLoadingProgressUI(indicator) {
        const progressValue = typeof indicator?.progress === "number" ? indicator.progress : 0,
            isActive = Boolean(indicator?.active);

        const progressElement = (() => {
            try {
                return document.querySelector("#file-loading-progress");
            } catch {
                return null;
            }
        })();

        if (progressElement) {
            progressElement.style.width = `${progressValue}%`;
            progressElement.setAttribute("aria-valuenow", progressValue.toString());
            progressElement.setAttribute("aria-hidden", (!isActive).toString());
        }
    }
    /**
     * Update measurement mode UI
     * @param {*} isActive - Whether measurement mode is active
     */
    updateMeasurementModeUI(isActive) {
        const toggleBtn = (() => {
            try {
                return document.querySelector("#measurement-mode-toggle");
            } catch {
                return null;
            }
        })();
        const mapContainer = (() => {
            try {
                return document.querySelector("#map-container");
            } catch {
                return null;
            }
        })();

        if (toggleBtn) {
            toggleBtn.classList.toggle("active", isActive);
            toggleBtn.textContent = isActive ? "Exit Measurement" : "Measure Distance";
        }

        if (mapContainer) {
            mapContainer.classList.toggle("measurement-mode", isActive);
        }
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
                    return /** @type {Element[]} */ ([...(doc.querySelectorAll(selector) || [])]);
                }
            } catch {
                /* Ignore errors */
            }
            return [];
        };
        const tabButtons = safeQuerySelectorAll("[data-tab]");

        const canonicalActive = normalizeTabName(activeTab);

        for (const button of tabButtons) {
            const tabName = typeof button.dataset.tab === "string" ? button.dataset.tab : "";
            const canonicalButton = normalizeTabName(tabName);
            const isActive = canonicalActive && canonicalButton
                ? canonicalButton === canonicalActive
                : tabName === activeTab;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", isActive.toString());
        }
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
                    return /** @type {Element[]} */ ([...(doc.querySelectorAll(selector) || [])]);
                }
            } catch {
                /* Ignore errors */
            }
            return [];
        };
        const tabContents = safeQuerySelectorAll(".tab-content");

        const canonicalActive = normalizeTabName(activeTab);

        for (const content of tabContents) {
            const tabName = typeof content.dataset.tabContent === "string" ? content.dataset.tabContent : "";
            const canonicalContent = normalizeTabName(tabName);
            const isActive = canonicalActive && canonicalContent
                ? canonicalContent === canonicalActive
                : tabName === activeTab;

            /** @type {HTMLElement} */ (content).style.display = isActive ? "block" : "none";
            content.setAttribute("aria-hidden", (!isActive).toString());
        }

        console.log(`[UIStateManager] Tab visibility updated: ${activeTab}`);
    }

    /**
     * Update unload button visibility
     * @param {boolean} isVisible - Whether unload button should be visible
     */
    updateUnloadButtonVisibility(isVisible) {
        const unloadBtn = (() => {
            try {
                return document.getElementById("unloadFileBtn");
            } catch {
                return null;
            }
        })();

        if (unloadBtn) {
            unloadBtn.style.display = isVisible ? "" : "none";
        }
    }

    /**
     * Update window state from DOM
     */
    updateWindowStateFromDOM() {
        const windowState = {
            height: window.innerHeight,
            maximized: window.outerWidth === screen.availWidth && window.outerHeight === screen.availHeight,
            width: window.innerWidth,
            x: window.screenX,
            y: window.screenY,
        };

        updateState("ui.windowState", windowState, { source: "UIStateManager.updateWindowStateFromDOM" });
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
     * Set theme
     * @param {string} theme - Theme to set
     */
    setTheme(theme) {
        AppActions.switchTheme(theme);
    },

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
