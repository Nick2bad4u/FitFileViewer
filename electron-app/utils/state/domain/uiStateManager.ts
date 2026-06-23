/**
 * UI State Management Utilities Specific utilities for managing UI state and
 * interactions
 */

import { AppActions } from "../../app/lifecycle/appActions.js";
import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../core/stateManager.js";
import { getActiveFitRawData } from "./activeFitRawDataState.js";
import { getUIStateManagerRuntime } from "./uiStateManagerRuntime.js";

type NotificationInput =
    | string
    | {
          duration?: number;
          message?: string;
          type?: string;
      };

type FileInfoState = {
    displayName?: string;
    hasFile?: boolean;
    title?: string;
};

type LoadingIndicatorState = {
    active?: boolean;
    progress?: number;
};

type ClickableElement = {
    addEventListener?: (
        type: string,
        handler: () => void,
        options?: AddEventListenerOptions
    ) => void;
};

function getNotificationMessage(notification: NotificationInput): string {
    return typeof notification === "string"
        ? notification
        : notification.message || "No message provided";
}

const uiStateManagerRuntime = getUIStateManagerRuntime();
const DEFAULT_DOCUMENT_TITLE =
    uiStateManagerRuntime.getDefaultDocumentTitle("Fit File Viewer");

/**
 * UI State Manager - handles common UI state operations
 */
export class UIStateManager {
    private readonly eventListeners = new Map<string, EventListener>();

    private eventListenerAbortController =
        uiStateManagerRuntime.createAbortController();

    private systemThemeListener: ((event: MediaQueryListEvent) => void) | null =
        null;

    constructor() {
        this.initialize();
    }

    /**
     * Apply theme to the UI
     */
    applyTheme(theme: string) {
        const root = document.documentElement || document.body || {};

        if (theme === "system") {
            // Remove explicit theme and use system preference
            delete root.dataset["theme"];

            // Listen for system theme changes if supported
            const mediaQuery =
                uiStateManagerRuntime.getSystemThemeMediaQuery();
            if (mediaQuery) {
                const systemTheme = mediaQuery.matches ? "dark" : "light";
                root.dataset["theme"] = systemTheme;

                // Update on system theme change
                if (!this.systemThemeListener) {
                    this.systemThemeListener = (e: MediaQueryListEvent) => {
                        const newSystemTheme = e.matches ? "dark" : "light";
                        root.dataset["theme"] = newSystemTheme;
                    };
                    if (typeof mediaQuery.addEventListener === "function") {
                        mediaQuery.addEventListener(
                            "change",
                            this.systemThemeListener,
                            {
                                signal: this.eventListenerAbortController
                                    .signal,
                            }
                        );
                    } else if (typeof mediaQuery.addListener === "function") {
                        // Older API fallback
                        mediaQuery.addListener(this.systemThemeListener);
                    }
                }
            } else {
                // Fallback when matchMedia is not available (e.g., jsdom)
                root.dataset["theme"] = "light";
            }
        } else {
            // Apply explicit theme
            root.dataset["theme"] = theme;

            // Remove system theme listener if it exists
            if (this.systemThemeListener) {
                const mediaQuery =
                    uiStateManagerRuntime.getSystemThemeMediaQuery();
                if (mediaQuery) {
                    if (typeof mediaQuery.removeEventListener === "function") {
                        mediaQuery.removeEventListener(
                            "change",
                            this.systemThemeListener
                        );
                    } else if (
                        typeof mediaQuery.removeListener === "function"
                    ) {
                        mediaQuery.removeListener(this.systemThemeListener);
                    }
                }
                this.systemThemeListener = null;
            }
        }

        // Update theme toggle buttons
        const themeButtons = (() => {
            try {
                return [...(document.querySelectorAll("[data-theme]") || [])];
            } catch {
                return [];
            }
        })();
        for (const button of themeButtons) {
            const buttonTheme =
                button instanceof HTMLElement
                    ? button.dataset["theme"]
                    : undefined;
            button.classList.toggle("active", buttonTheme === theme);
        }

        console.log(`[UIStateManager] Theme applied: ${theme}`);
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        // Remove system theme listener if it exists
        if (this.systemThemeListener) {
            const mediaQuery = uiStateManagerRuntime.getSystemThemeMediaQuery();
            mediaQuery?.removeEventListener("change", this.systemThemeListener);
        }

        // Clear custom event listeners
        this.eventListenerAbortController.abort();
        this.eventListenerAbortController =
            uiStateManagerRuntime.createAbortController();
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
        subscribe("ui.activeTab", (activeTab) => {
            const tabName =
                typeof activeTab === "string"
                    ? activeTab
                    : String(activeTab ?? "");
            this.updateTabVisibility(tabName);
            this.updateTabButtons(tabName);
        });

        // Subscribe to theme changes
        subscribe("ui.theme", (theme) => {
            this.applyTheme(typeof theme === "string" ? theme : "system");
        });

        // Subscribe to unload button visibility
        subscribe("ui.unloadButtonVisible", (isVisible) => {
            this.updateUnloadButtonVisibility(Boolean(isVisible));
        });

        // Subscribe to file display updates
        subscribe("ui.fileInfo", (fileInfo) => {
            this.updateFileDisplayUI(
                fileInfo as FileInfoState | null | undefined
            );
        });

        // Subscribe to loading indicator progress
        subscribe("ui.loadingIndicator", (indicator) => {
            this.updateLoadingProgressUI(
                indicator as LoadingIndicatorState | null | undefined
            );
        });

        // Subscribe to loading state changes
        subscribe("isLoading", (isLoading) => {
            this.updateLoadingIndicator(Boolean(isLoading));
        });

        // Subscribe to chart controls visibility
        subscribe("charts.controlsVisible", (isVisible) => {
            this.updateChartControlsUI(Boolean(isVisible));
        });

        // Subscribe to measurement mode changes
        subscribe("map.measurementMode", (isActive) => {
            this.updateMeasurementModeUI(Boolean(isActive));
        });

        // Subscribe to drop overlay visibility changes
        subscribe("ui.dropOverlay.visible", (isVisible) => {
            this.updateDropOverlayVisibility(Boolean(isVisible));
        });

        // Apply persisted states on startup
        this.updateUnloadButtonVisibility(
            Boolean(getState("ui.unloadButtonVisible"))
        );
        this.updateFileDisplayUI(
            getState("ui.fileInfo") as FileInfoState | null | undefined
        );
        this.updateLoadingProgressUI(
            getState("ui.loadingIndicator") as
                | LoadingIndicatorState
                | null
                | undefined
        );
        this.updateLoadingIndicator(Boolean(getState("isLoading")));
        this.updateDropOverlayVisibility(
            Boolean(getState("ui.dropOverlay.visible"))
        );
    }

    /**
     * Set up DOM event listeners that sync with state
     */
    setupEventListeners() {
        // Safe helpers to guard against jsdom brand-check errors or replaced globals
        const safeQuerySelectorAll = (selector: string): Element[] => {
            try {
                const doc = document;
                if (doc && typeof doc.querySelectorAll === "function") {
                    // Array.from guards non-iterables
                    return [...(doc.querySelectorAll(selector) || [])];
                }
            } catch {
                // Swallow to keep tests stable if document was swapped or methods are from another realm
            }
            return [];
        };
        const safeGetById = (id: string): HTMLElement | null => {
            try {
                return getElementByIdFlexible(document, id);
            } catch {
                return null;
            }
        };

        /**
         * Safely attach a click handler.
         *
         * Some unit tests stub DOM nodes with plain objects; in production
         * these are real HTMLElements. Guard to avoid runtime crashes.
         */
        const safeAddClickListener = (
            el: ClickableElement | null | undefined,
            handler: () => void
        ): void => {
            if (el && typeof el.addEventListener === "function") {
                el.addEventListener("click", handler, {
                    signal: this.eventListenerAbortController.signal,
                });
            }
        };

        // Tab switching
        const tabButtons = safeQuerySelectorAll("[data-tab]");
        for (const button of tabButtons) {
            const tabName =
                button instanceof HTMLElement
                    ? button.dataset["tab"]
                    : undefined;
            safeAddClickListener(button, () => {
                if (tabName) {
                    AppActions.switchTab(tabName);
                }
            });
        }

        // Theme toggle buttons
        //
        // IMPORTANT:
        // The theming system sets `data-theme` on <html> and <body>.
        // If we attach click listeners to *all* `[data-theme]` elements, then
        // any click anywhere in the app (bubbling to <body>) can re-assert the
        // previous theme and effectively "undo" a user change.
        //
        // Only treat explicit UI controls as theme toggles.
        const themeButtons = safeQuerySelectorAll(
            'button[data-theme], [role="button"][data-theme]'
        );
        for (const button of themeButtons) {
            const theme =
                button instanceof HTMLElement
                    ? button.dataset["theme"]
                    : undefined;
            safeAddClickListener(button, () => {
                if (theme) {
                    AppActions.switchTheme(theme);
                }
            });
        }

        // Chart controls toggle
        const chartToggle = (() => {
            try {
                return uiStateManagerRuntime.getChartControlsToggleElement();
            } catch {
                return null;
            }
        })();
        safeAddClickListener(chartToggle, () => {
            AppActions.toggleChartControls();
        });

        // Measurement mode toggle
        const measureToggle = safeGetById("measurement-mode-toggle");
        safeAddClickListener(measureToggle, () => {
            AppActions.toggleMeasurementMode();
        });
    }

    /**
     * Show a notification to the user
     */
    showNotification(notification: NotificationInput) {
        try {
            // Handle both object and string parameters for backward compatibility
            let duration, message, type;

            if (typeof notification === "string") {
                message = notification;
                type = "info";
                duration = 3000;
            } else if (
                typeof notification === "object" &&
                notification !== null
            ) {
                message = notification.message || "No message provided";
                type = notification.type || "info";
                duration = notification.duration || 3000;
            } else {
                console.warn(
                    "[UIStateManager] Invalid notification parameter:",
                    notification
                );
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
            console.error(
                "[UIStateManager] Failed to show notification:",
                error
            );
            console.log(
                `[Notification] ${getNotificationMessage(notification)}`
            );
        }
    }

    /**
     * Show/hide sidebar
     */
    toggleSidebar(collapsed?: boolean) {
        const currentState = getState("ui.sidebarCollapsed"),
            newState = collapsed === undefined ? !currentState : collapsed;

        setState("ui.sidebarCollapsed", newState, {
            source: "UIStateManager.toggleSidebar",
        });

        const mainContent = (() => {
            try {
                return uiStateManagerRuntime.getMainContentElement();
            } catch {
                return null;
            }
        })();
        const sidebar = (() => {
            try {
                return uiStateManagerRuntime.getSidebarElement();
            } catch {
                return null;
            }
        })();

        if (sidebar) {
            sidebar.classList.toggle("collapsed", newState);
        }

        if (mainContent) {
            mainContent.classList.toggle("sidebar-collapsed", newState);
        }
    }

    /**
     * Update chart controls UI
     */
    updateChartControlsUI(isVisible: boolean) {
        const wrapper = (() => {
            try {
                return uiStateManagerRuntime.getChartSettingsWrapperElement();
            } catch {
                return null;
            }
        })();
        const toggleBtn = (() => {
            try {
                return uiStateManagerRuntime.getChartControlsToggleElement();
            } catch {
                return null;
            }
        })();

        if (wrapper) {
            wrapper.style.display = isVisible ? "block" : "none";
        }

        if (toggleBtn) {
            toggleBtn.textContent = isVisible
                ? "▼ Hide Controls"
                : "▶ Show Controls";
            toggleBtn.setAttribute("aria-expanded", isVisible.toString());
        }
    }
    /**
     * Update drop overlay visibility and related iframe pointer state
     */
    updateDropOverlayVisibility(isVisible: boolean) {
        const dropOverlay = (() => {
            try {
                return getElementByIdFlexible(document, "drop_overlay");
            } catch {
                return null;
            }
        })();

        if (dropOverlay) {
            dropOverlay.style.display = isVisible ? "flex" : "none";
        }

        const altFitIframe = (() => {
            try {
                return getElementByIdFlexible(document, "altfit_iframe");
            } catch {
                return null;
            }
        })();

        if (altFitIframe) {
            altFitIframe.style.pointerEvents = isVisible ? "none" : "";
        }

        const zwiftIframe = (() => {
            try {
                return getElementByIdFlexible(document, "zwift_iframe");
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
     */
    updateFileDisplayUI(fileInfo: FileInfoState | null | undefined) {
        const info = fileInfo || {},
            requestedHasFile = Boolean(info.hasFile),
            displayName =
                typeof info.displayName === "string" ? info.displayName : "",
            title =
                typeof info.title === "string" && info.title.trim().length > 0
                    ? info.title
                    : DEFAULT_DOCUMENT_TITLE,
            activeFitRawData = getActiveFitRawData(),
            hasRenderableFile = Boolean(
                requestedHasFile && displayName && activeFitRawData
            );

        const fileNameContainer = (() => {
            try {
                return getElementByIdFlexible(
                    document,
                    "active_file_name_container"
                );
            } catch {
                return null;
            }
        })();
        if (fileNameContainer) {
            fileNameContainer.classList.toggle("has-file", hasRenderableFile);
        }

        uiStateManagerRuntime.setAppHasFileState(hasRenderableFile);

        const fileSpan = (() => {
            try {
                return getElementByIdFlexible(document, "active_file_name");
            } catch {
                return null;
            }
        })();

        if (fileSpan) {
            if (hasRenderableFile) {
                // Security: avoid `innerHTML` here. `displayName` can originate from user-controlled
                // file paths and must never be interpreted as markup.
                const labelSpan = document.createElement("span");
                labelSpan.className = "active-label";
                labelSpan.textContent = "Active:";

                const nameSpan = document.createElement("span");
                nameSpan.className = "filename-text";
                nameSpan.textContent = displayName;

                // Prevent long filenames (with auto-scroll animation) from rendering underneath the
                // fixed "Active:" label. The viewport clips the scrolling text region.
                const nameViewport = document.createElement("span");
                nameViewport.className = "filename-viewport";
                nameViewport.append(nameSpan);

                // Keep spacing via CSS (margin-right on `.active-label`) so the filename viewport
                // reliably clips the scrolling text and never renders underneath the fixed label.
                fileSpan.replaceChildren(labelSpan, nameViewport);
                fileSpan.title = displayName;
                fileSpan.classList.remove("marquee");
                fileSpan.scrollLeft = 0;
            } else {
                fileSpan.textContent = "";
                fileSpan.title = "";
                fileSpan.classList.remove("marquee");
            }
        }

        try {
            uiStateManagerRuntime.setDocumentTitle(title);
        } catch {
            /* Ignore errors */
        }
    }
    /**
     * Update loading indicator visibility
     */
    updateLoadingIndicator(isLoading: boolean) {
        const loadingIndicator = (() => {
            try {
                return uiStateManagerRuntime.getLoadingIndicatorElement();
            } catch {
                return null;
            }
        })();
        const mainContent = (() => {
            try {
                return uiStateManagerRuntime.getMainContentElement();
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
            uiStateManagerRuntime.setBodyCursor(
                isLoading ? "wait" : "default"
            );
        } catch {
            /* Ignore errors */
        }
    }
    /**
     * Update loading progress UI based on indicator state
     *
     * Loading indicator state
     */
    updateLoadingProgressUI(
        indicator: LoadingIndicatorState | null | undefined
    ) {
        const progressValue =
                typeof indicator?.progress === "number"
                    ? indicator.progress
                    : 0,
            isActive = Boolean(indicator?.active);

        const progressElement = (() => {
            try {
                return uiStateManagerRuntime.getFileLoadingProgressElement();
            } catch {
                return null;
            }
        })();

        if (progressElement) {
            progressElement.style.width = `${progressValue}%`;
            progressElement.setAttribute(
                "aria-valuenow",
                progressValue.toString()
            );
            progressElement.setAttribute("aria-hidden", (!isActive).toString());
        }
    }
    /**
     * Update measurement mode UI
     */
    updateMeasurementModeUI(isActive: boolean) {
        const toggleBtn = (() => {
            try {
                return uiStateManagerRuntime.getMeasurementModeToggleElement();
            } catch {
                return null;
            }
        })();
        const mapContainer = (() => {
            try {
                return uiStateManagerRuntime.getMapContainerElement();
            } catch {
                return null;
            }
        })();

        if (toggleBtn) {
            toggleBtn.classList.toggle("active", isActive);
            toggleBtn.textContent = isActive
                ? "Exit Measurement"
                : "Measure Distance";
        }

        if (mapContainer) {
            mapContainer.classList.toggle("measurement-mode", isActive);
        }
    }

    /**
     * Update tab button states
     */
    updateTabButtons(activeTab: string) {
        /**/
        const safeQuerySelectorAll = (selector: string): Element[] => {
            try {
                const doc = document;
                if (doc && typeof doc.querySelectorAll === "function") {
                    return [...(doc.querySelectorAll(selector) || [])];
                }
            } catch {
                /* Ignore errors */
            }
            return [];
        };
        const tabButtons = safeQuerySelectorAll("[data-tab]");

        for (const button of tabButtons) {
            const tabName =
                    button instanceof HTMLElement
                        ? button.dataset["tab"]
                        : undefined,
                isActive = tabName === activeTab;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", isActive.toString());
        }
    }

    /**
     * Update tab visibility based on active tab
     */
    updateTabVisibility(activeTab: string) {
        /**/
        const safeQuerySelectorAll = (selector: string): Element[] => {
            try {
                const doc = document;
                if (doc && typeof doc.querySelectorAll === "function") {
                    return [...(doc.querySelectorAll(selector) || [])];
                }
            } catch {
                /* Ignore errors */
            }
            return [];
        };
        const tabContents = safeQuerySelectorAll(".tab-content");

        for (const content of tabContents) {
            const tabName =
                    content instanceof HTMLElement
                        ? content.dataset["tabContent"]
                        : undefined,
                isActive = tabName === activeTab;

            if (content instanceof HTMLElement) {
                content.style.display = isActive ? "block" : "none";
            }
            content.setAttribute("aria-hidden", (!isActive).toString());
        }

        console.log(`[UIStateManager] Tab visibility updated: ${activeTab}`);
    }

    /**
     * Update unload button visibility
     */
    updateUnloadButtonVisibility(isVisible: boolean) {
        const unloadBtn = (() => {
            try {
                return getElementByIdFlexible(document, "unload_file_btn");
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
        const windowState = uiStateManagerRuntime.getWindowState();
        if (windowState === null) {
            return;
        }

        updateState("ui.windowState", windowState, {
            source: "UIStateManager.updateWindowStateFromDOM",
        });
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
     */
    setTheme(theme: string) {
        AppActions.switchTheme(theme);
    },

    /**
     * Show a tab
     */
    showTab(tabName: string) {
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
     */
    toggleSidebar(collapsed?: boolean) {
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
if (uiStateManagerRuntime.hasWindow()) {
    const windowListenerAbortController =
        uiStateManagerRuntime.createAbortController();

    uiStateManagerRuntime.addWindowEventListener(
        "resize",
        () => {
            UIActions.updateWindowState();
        },
        {
            signal: windowListenerAbortController.signal,
        }
    );

    // Set up beforeunload to save state
    uiStateManagerRuntime.addWindowEventListener(
        "beforeunload",
        () => {
            UIActions.updateWindowState();
            windowListenerAbortController.abort();
        },
        {
            signal: windowListenerAbortController.signal,
        }
    );
}
