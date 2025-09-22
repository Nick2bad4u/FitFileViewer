/**
 * @fileoverview Main UI Controller with State Management Integration
 * @description Handles UI interactions, file operations, and state management for the FitFileViewer application
 * @author FitFileViewer Development Team
 * @version 2.0.0
 */

import { setupWindow } from "./utils/app/initialization/setupWindow.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { chartTabIntegration } from "./utils/charts/core/chartTabIntegration.js";
import { renderChartJS } from "./utils/charts/core/renderChartJS.js";
import { performanceMonitor } from "./utils/debug/stateDevTools.js";
import { convertArrayBufferToBase64 } from "./utils/formatting/converters/convertArrayBufferToBase64.js";
import { showFitData } from "./utils/rendering/core/showFitData.js";
// State Management Integration
import { getState, setState } from "./utils/state/core/stateManager.js";
import { fitFileStateManager } from "./utils/state/domain/fitFileState.js";
import { UIActions } from "./utils/state/domain/uiStateManager.js";
// This file is part of the Electron app that interacts with the main process and the UI.
import { applyTheme, listenForThemeChange, loadTheme } from "./utils/theming/core/theme.js";
import { setupDOMContentLoaded, setupFullscreenListeners } from "./utils/ui/controls/addFullScreenButton.js";
import { showNotification } from "./utils/ui/notifications/showNotification.js";

/**
 * @typedef {Object} FitFileData Placeholder for decoded FIT file structure
 * @property {Object<string, any>} [recordMesgs]
 */

/**
 * @typedef {Object} DragDropHandlerLike
 * @property {Function} showDropOverlay
 * @property {Function} hideDropOverlay
 * @property {(file: File) => Promise<void>} processDroppedFile
 */

/**
 * @typedef {Object} StateChangeOptions
 * @property {boolean} [silent]
 * @property {string} source
 */

// Constants (add missing CONTENT_CHART used by clearContentAreas)
const CONSTANTS = {
        DOM_IDS: {
            ACTIVE_FILE_NAME: "activeFileName",
            ACTIVE_FILE_NAME_CONTAINER: "activeFileNameContainer",
            ALT_FIT_IFRAME: "altfit-iframe",
            CONTENT_CHART: "content-chart",
            CONTENT_DATA: "content-data",
            CONTENT_MAP: "content-map",
            CONTENT_SUMMARY: "content-summary",
            DROP_OVERLAY: "drop-overlay",
            TAB_CHART: "tab-chart",
            TAB_SUMMARY: "tab-summary",
            UNLOAD_FILE_BTN: "unloadFileBtn",
            ZWIFT_IFRAME: "zwift-iframe",
        },
        IFRAME_PATHS: {
            ALT_FIT: "libs/ffv/index.html",
        },
        SELECTORS: {
            SUMMARY_GEAR_BTN: ".summary-gear-btn",
        },
        SUMMARY_COLUMN_SELECTOR_DELAY: 100,
    },
    // Event listener management with state integration
    eventListeners = new Map();

// Make globalData available on window for backwards compatibility
try {
    const existing = Object.getOwnPropertyDescriptor(globalThis, "globalData");
    if (!existing || existing.configurable) {
        Object.defineProperty(globalThis, "globalData", {
            configurable: true,
            enumerable: true,
            get() {
                return getState("globalData");
            },
            set(value) {
                setState("globalData", value, { silent: false, source: "main-ui.js" });
            },
        });
    }
} catch {
    /* Ignore redefinition issues */
}

// Event listener management with state integration
/**
 * @param {EventTarget & { addEventListener: Function, removeEventListener: Function }} element
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {AddEventListenerOptions|boolean} [options]
 */
function addEventListenerWithCleanup(element, event, handler, options = {}) {
    if (!element) {
        return;
    }

    element.addEventListener(event, handler, options);
    const key = `${element.constructor.name}-${event}`;
    if (!eventListeners.has(key)) {
        eventListeners.set(key, []);
    }
    eventListeners.get(key).push({ element, event, handler });
}

function cleanupEventListeners() {
    for (const listeners of eventListeners) {
        for (const { element, event, handler } of listeners) {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler);
            }
        }
    }
    eventListeners.clear();
}

function clearContentAreas() {
    const contentIds = [
        CONSTANTS.DOM_IDS.CONTENT_MAP,
        CONSTANTS.DOM_IDS.CONTENT_DATA,
        CONSTANTS.DOM_IDS.CONTENT_CHART,
        CONSTANTS.DOM_IDS.CONTENT_SUMMARY,
    ];

    for (const id of contentIds) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = "";
        }
    }
}

// Utility functions for file operations
function clearFileDisplay() {
    const fileSpan = validateElement(CONSTANTS.DOM_IDS.ACTIVE_FILE_NAME);
    if (fileSpan) {
        fileSpan.textContent = "";
        fileSpan.title = "";
        fileSpan.classList.remove("marquee");
    }

    const fileNameContainer = validateElement(CONSTANTS.DOM_IDS.ACTIVE_FILE_NAME_CONTAINER);
    if (fileNameContainer) {
        fileNameContainer.classList.remove("has-file");
    }
}

function unloadFitFile() {
    const operationId = `unload_file_${Date.now()}`;

    // Start performance monitoring (tolerate differing impl shapes)
    {
        const pm = /** @type {any} */ (performanceMonitor);
        if (
            pm &&
            (typeof pm.isEnabled === "function" ? pm.isEnabled() : Boolean(pm.isEnabled)) &&
            typeof pm.startTimer === "function"
        ) {
            pm.startTimer(operationId);
        }
    }

    try {
        // Clear global data using state management
        // Prefer clearData for backward compatibility if clearGlobalData absent
        if (AppActions.clearData) {
            AppActions.clearData();
        }

        // Update file state
        if (fitFileStateManager) {
            fitFileStateManager.handleFileLoaded(/** @type {any} */ (null));
        }

        // Clear UI
        clearFileDisplay();
        clearContentAreas();

        // Hide unload button
        const unloadBtn = validateElement(CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN);
        if (unloadBtn) {
            unloadBtn.style.display = "none";
        }

        // Switch to map tab using UI actions
        UIActions.showTab("tab-map");

        // Notify main process to update menu
        if (globalThis.electronAPI && globalThis.electronAPI.send) {
            globalThis.electronAPI.send("fit-file-loaded", null);
        }

        // Tab buttons will be disabled automatically by state management when globalData is cleared

        // Show success notification
        showNotification("File unloaded successfully", "info");

        console.log("[main-ui] File unloaded successfully");
    } catch (error) {
        console.error("[main-ui] Error unloading file:", error);
        showNotification("Error unloading file", "error");
    } finally {
        // End performance monitoring
        {
            const pm2 = /** @type {any} */ (performanceMonitor);
            if (
                pm2 &&
                (typeof pm2.isEnabled === "function" ? pm2.isEnabled() : Boolean(pm2.isEnabled)) &&
                typeof pm2.endTimer === "function"
            ) {
                pm2.endTimer(operationId);
            }
        }
    }
}

// Validation functions
function validateElectronAPI() {
    return globalThis.electronAPI && typeof globalThis.electronAPI.decodeFitFile === "function";
}

/**
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function validateElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}

// Expose essential functions to window for backward compatibility
// @ts-ignore augmenting window for legacy globals
globalThis.showFitData = showFitData;
// @ts-ignore legacy compatibility
globalThis.renderChartJS = renderChartJS;
// @ts-ignore
globalThis.cleanupEventListeners = cleanupEventListeners;

// Enhanced iframe communication with better error handling
// @ts-ignore legacy global
globalThis.sendFitFileToAltFitReader = async function (arrayBuffer /** @type {ArrayBuffer} */) {
    const iframe = validateElement(CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
    if (!iframe) {
        console.warn("Alt FIT iframe not found");
        return;
    }

    // If iframe is not loaded yet, wait for it to load before posting message
    const frame = /** @type {HTMLIFrameElement} */ (iframe),
        postToIframe = () => {
            try {
                if (frame.contentWindow) {
                    const base64 = convertArrayBufferToBase64(arrayBuffer);
                    frame.contentWindow.postMessage({ base64, type: "fit-file" }, "*");
                }
            } catch (error) {
                console.error("Error posting message to iframe:", error);
            }
        };
    if (!frame.src || !frame.src.includes(CONSTANTS.IFRAME_PATHS.ALT_FIT)) {
        frame.src = CONSTANTS.IFRAME_PATHS.ALT_FIT;
        frame.addEventListener("load", postToIframe);
    } else if (frame.contentWindow && frame.src) {
        postToIframe();
    } else {
        frame.addEventListener("load", postToIframe);
    }
};

// Enhanced theme change handling with state management integration
if (
    globalThis.electronAPI &&
    typeof globalThis.electronAPI.onSetTheme === "function" &&
    typeof globalThis.electronAPI.sendThemeChanged === "function"
) {
    // Clean theme change handling through state management
    listenForThemeChange((theme) => {
        applyTheme(theme);

        // Update theme in state management - this will trigger reactive chart updates
        UIActions.setTheme(theme);

        console.log(`[main-ui] Theme changed to: ${theme}`);
    });
}

// On load, apply theme
applyTheme(loadTheme());

// Enhanced menu event handling with better error checking
if (globalThis.electronAPI && globalThis.electronAPI.onOpenSummaryColumnSelector === undefined) {
    globalThis.electronAPI.onOpenSummaryColumnSelector = (callback) => {
        if (globalThis.electronAPI && /** @type {any} */ (globalThis.electronAPI)._summaryColListenerAdded !== true) {
            /** @type {any} */ (globalThis.electronAPI)._summaryColListenerAdded = true;
            globalThis.electronAPI.onIpc("open-summary-column-selector", callback);
        }
    };
}

// Register handler to show summary column selector from menu
if (globalThis.electronAPI && globalThis.electronAPI.onIpc) {
    globalThis.electronAPI.onIpc("open-summary-column-selector", () => {
        try {
            // Switch to summary tab if not already active
            const tabSummary = validateElement(CONSTANTS.DOM_IDS.TAB_SUMMARY);
            if (tabSummary && !tabSummary.classList.contains("active")) {
                (tabSummary instanceof HTMLElement ? tabSummary : /** @type {any} */ (tabSummary)).click();
            }

            // Wait for renderSummary to finish, then open the column selector
            setTimeout(() => {
                const gearBtn = document.querySelector(CONSTANTS.SELECTORS.SUMMARY_GEAR_BTN);
                if (gearBtn) {
                    (gearBtn instanceof HTMLElement ? gearBtn : /** @type {any} */ (gearBtn)).click();
                } else {
                    console.warn("Summary gear button not found");
                }
            }, CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY);
        } catch (error) {
            console.error("Error handling summary column selector:", error);
        }
    });
}

// Listen for unload-fit-file event from main process
if (globalThis.electronAPI && globalThis.electronAPI.onIpc) {
    globalThis.electronAPI.onIpc("unload-fit-file", unloadFitFile);
}

// Unload file when the red X is clicked
const unloadBtn = validateElement(CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN);
if (unloadBtn) {
    unloadBtn.addEventListener("click", unloadFitFile);
}

// Tab button state is now managed automatically by the state management system
// In utils/ui/controls/enableTabButtons.js

// Enhanced Drag and Drop UI and Global Handling with State Management
class DragDropHandler {
    constructor() {
        this.setupEventListeners();
        // Initialize drag counter in state
        setState("ui.dragCounter", 0, { silent: false, source: "DragDropHandler" });
    }

    hideDropOverlay() {
        const dropOverlay = validateElement(CONSTANTS.DOM_IDS.DROP_OVERLAY);
        if (dropOverlay) {
            dropOverlay.style.display = "none";
        }

        const iframe = validateElement(CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
        if (iframe) {
            iframe.style.pointerEvents = "";
        }

        const zwiftIframe = validateElement(CONSTANTS.DOM_IDS.ZWIFT_IFRAME);
        if (zwiftIframe) {
            zwiftIframe.style.pointerEvents = "";
        }
    }

    /** @param {File} file */
    async processDroppedFile(file) {
        const operationId = `process_dropped_file_${Date.now()}`,
            // Start performance monitoring
            /** @type {{isEnabled?:()=>boolean,startTimer?:(id:string)=>void,endTimer?:(id:string)=>void}} */
            pm = /** @type {any} */ (performanceMonitor) || {};
        if (
            (typeof pm.isEnabled === "function" ? pm.isEnabled() : Boolean(pm.isEnabled)) &&
            typeof pm.startTimer === "function"
        ) {
            pm.startTimer(operationId);
        }

        if (!file || !file.name.toLowerCase().endsWith(".fit")) {
            const message = "Only .fit files are supported. Please drop a valid .fit file.";
            showNotification(message, "warning");
            return;
        }

        try {
            // Update loading state
            AppActions.setFileOpening(true);

            // Start file loading in state manager
            if (fitFileStateManager) {
                fitFileStateManager.startFileLoading(file.name);
            }

            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            if (!arrayBuffer) {
                return;
            }

            if (!validateElectronAPI()) {
                const message = "FIT file decoding is not supported in this environment.";
                showNotification(message, "error");
                return;
            }

            const fitData = await globalThis.electronAPI.decodeFitFile(arrayBuffer);
            if (fitData && !fitData.error) {
                showFitData(fitData, file.name);
                // @ts-ignore ensured above
                globalThis.sendFitFileToAltFitReader(arrayBuffer);
                showNotification(`File "${file.name}" loaded successfully`, "success");
            } else {
                showNotification("Failed to load FIT file", "error");

                // Handle error in state manager
                if (fitFileStateManager) {
                    fitFileStateManager.handleFileLoadingError(new Error(fitData.error || "Unknown error"));
                }
            }
        } catch (error) {
            console.error("[main-ui] Error processing dropped file:", error);
            const message = "An unexpected error occurred while processing the FIT file.";
            showNotification(message, "error");

            // Handle error in state manager
            if (fitFileStateManager) {
                fitFileStateManager.handleFileLoadingError(
                    /** @type {Error} */ (error instanceof Error ? error : new Error(String(error)))
                );
            }
        } finally {
            // Clear loading state
            AppActions.setFileOpening(false);

            // End performance monitoring
            const pm2 = /** @type {any} */ (performanceMonitor) || {};
            if (
                (typeof pm2.isEnabled === "function" ? pm2.isEnabled() : Boolean(pm2.isEnabled)) &&
                typeof pm2.endTimer === "function"
            ) {
                pm2.endTimer(operationId);
            }
        }
    }

    /** @param {File} file */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", (event) => {
                resolve(/** @type {any} */ (event).target?.result || null);
            });
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    setupEventListeners() {
        // Show overlay on dragenter, hide on dragleave/drop
        addEventListenerWithCleanup(globalThis, "dragenter", (/** @type {Event} */ e) => {
            if (e.target === document || e.target === document.body) {
                const currentCounter = getState("ui.dragCounter") || 0;
                setState("ui.dragCounter", currentCounter + 1, { silent: false, source: "DragDropHandler" });
                this.showDropOverlay();
            }
        });

        addEventListenerWithCleanup(globalThis, "dragleave", (/** @type {Event} */ e) => {
            if (e.target === document || e.target === document.body) {
                const currentCounter = getState("ui.dragCounter") || 0,
                    newCounter = currentCounter - 1;
                setState("ui.dragCounter", newCounter, { silent: false, source: "DragDropHandler" });
                if (newCounter <= 0) {
                    this.hideDropOverlay();
                    setState("ui.dragCounter", 0, { silent: false, source: "DragDropHandler" });
                }
            }
        });

        addEventListenerWithCleanup(globalThis, "dragover", (/** @type {Event} */ e) => {
            e.preventDefault();
            const de = /** @type {any} */ (e);
            if (de.dataTransfer) {
                de.dataTransfer.dropEffect = "copy";
            }
            this.showDropOverlay();
        });

        addEventListenerWithCleanup(globalThis, "drop", async (/** @type {Event} */ e) => {
            setState("ui.dragCounter", 0, { silent: false, source: "DragDropHandler" });
            this.hideDropOverlay();
            e.preventDefault();
            const de = /** @type {any} */ (e);
            if (!de.dataTransfer || !de.dataTransfer.files || de.dataTransfer.files.length === 0) {
                const message = "No valid files detected. Please drop a .fit file.";
                showNotification(message, "warning");
                return;
            }

            const [first] = de.dataTransfer.files;
            if (first) {
                await this.processDroppedFile(first);
            }
        });

        // Prevent iframe from blocking drag/drop events if drag-and-drop is enabled
        if (/** @type {any} */ (globalThis).enableDragAndDrop) {
            this.setupIframeEventListeners();
        }
    }
    setupIframeEventListeners() {
        const iframe = validateElement(CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
        if (iframe) {
            addEventListenerWithCleanup(iframe, "dragover", (e) => {
                e.preventDefault();
                this.showDropOverlay();
            });
            addEventListenerWithCleanup(iframe, "drop", (e) => {
                e.preventDefault();
                this.hideDropOverlay();
                showNotification("Please drop files outside the iframe to process them.", "info");
            });
        }

        const zwiftIframe = validateElement(CONSTANTS.DOM_IDS.ZWIFT_IFRAME);
        if (zwiftIframe) {
            addEventListenerWithCleanup(zwiftIframe, "dragover", (e) => {
                e.preventDefault();
                this.showDropOverlay();
            });
            addEventListenerWithCleanup(zwiftIframe, "drop", (e) => {
                e.preventDefault();
                this.hideDropOverlay();
                showNotification("Please drop files outside the ZwiftMap iframe to process them.", "info");
            });
        }
    }

    showDropOverlay() {
        const dropOverlay = validateElement(CONSTANTS.DOM_IDS.DROP_OVERLAY);
        if (dropOverlay) {
            dropOverlay.style.display = "flex";
        }

        const iframe = validateElement(CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
        if (iframe) {
            iframe.style.pointerEvents = "none";
        }

        const zwiftIframe = validateElement(CONSTANTS.DOM_IDS.ZWIFT_IFRAME);
        if (zwiftIframe) {
            zwiftIframe.style.pointerEvents = "none";
        }
    }
}

// Initialize drag and drop handler
const dragDropHandler = new DragDropHandler();

// Expose dragDropHandler for cleanup if needed
// @ts-ignore legacy global
globalThis.dragDropHandler = dragDropHandler;

// Move event listener setup to utility functions
// Sets up event listeners to handle fullscreen mode toggling for the application.
setupFullscreenListeners();

// Sets up event listeners to handle DOMContentLoaded events for initializing UI components.
setupDOMContentLoaded();

// Initialize the application window with modern state management
setupWindow();

// External link handler for opening links in default browser
function setupExternalLinkHandlers() {
    // Use event delegation to handle both existing and dynamically added external links
    document.addEventListener("click", (/** @type {MouseEvent} */ e) => {
        const target = e.target instanceof HTMLElement ? e.target : null,
            link = target?.closest('[data-external-link="true"]');
        if (link) {
            handleExternalLink(e, /** @type {HTMLElement} */ (link));
        }
    });

    document.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
        if (e.key === "Enter" || e.key === " ") {
            const target = e.target instanceof HTMLElement ? e.target : null,
                link = target?.closest('[data-external-link="true"]');
            if (link) {
                handleExternalLink(
                    /** @type {MouseEvent} */ (/** @type {any} */ (e)),
                    /** @type {HTMLElement} */ (link)
                );
            }
        }
    });

    /**
     * @param {MouseEvent} e
     * @param {HTMLElement} link
     */
    function handleExternalLink(e, link) {
        e.preventDefault();
        const url = link.getAttribute("href");
        if (url && globalThis.electronAPI && globalThis.electronAPI.openExternal) {
            globalThis.electronAPI.openExternal(url).catch((error) => {
                console.error("Failed to open external link:", error);
                // Fallback to window.open if openExternal fails
                window.open(url, "_blank", "noopener,noreferrer");
            });
        } else if (url) {
            // Fallback for non-Electron environments
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }
}

// Initialize external link handlers after DOM is loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupExternalLinkHandlers);
} else {
    setupExternalLinkHandlers();
}

// Enhanced development helper function with better error handling
// @ts-ignore legacy global
globalThis.injectMenu = function (theme = null, fitFilePath = null) {
    try {
        if (globalThis.electronAPI && typeof globalThis.electronAPI.injectMenu === "function") {
            globalThis.electronAPI.injectMenu(theme, fitFilePath);
            console.log("[injectMenu] Requested menu injection with theme:", theme, "fitFilePath:", fitFilePath);
        } else {
            console.warn("[injectMenu] electronAPI.injectMenu is not available.");
        }
    } catch (error) {
        console.error("[injectMenu] Error during menu injection:", error);
    }
};

// Add cleanup function to development helpers with state management integration
// @ts-ignore legacy global
globalThis.devCleanup = function () {
    cleanupEventListeners();

    // Clear state using the new system
    if (AppActions.clearData) {
        AppActions.clearData();
    }
    setState("charts.isRendered", false, { silent: false, source: "devCleanup" });
    setState("ui.dragCounter", 0, { silent: false, source: "devCleanup" });

    // Clean up our new state managers
    if (/** @type {any} */ (globalThis).chartTabIntegration) {
        // @ts-ignore legacy
        globalThis.chartTabIntegration.destroy();
    }

    console.log("[devCleanup] Application state and event listeners cleaned up");
};

console.log("[DEV] Development helpers available:");
console.log("- window.injectMenu(theme, fitFilePath) - Inject menu with specified theme and file path");
console.log("- window.devCleanup() - Clean up application state and event listeners");
console.log("- window.cleanupEventListeners() - Clean up all event listeners");

// Initialize state managers
console.log("[main-ui] Initializing state managers...");

// The imports automatically initialize the state managers
// ChartTabIntegration is a singleton that self-initializes and brings in the other managers
console.log("[main-ui] Chart tab integration:", chartTabIntegration?.getStatus?.() || "Not available");

console.log("[main-ui] State managers initialized successfully");
