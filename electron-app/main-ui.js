/**
 * @fileoverview Main UI Controller with State Management Integration
 * @description Handles UI interactions, file operations, and state management for the FitFileViewer application
 * @author FitFileViewer Development Team
 * @version 2.0.0
 */

// This file is part of the Electron app that interacts with the main process and the UI.
import { applyTheme, loadTheme, listenForThemeChange } from "./utils/theming/core/theme.js";
import { showFitData } from "./utils/rendering/core/showFitData.js";
import { convertArrayBufferToBase64 } from "./utils/formatting/converters/convertArrayBufferToBase64.js";
import { setupFullscreenListeners, setupDOMContentLoaded } from "./utils/ui/controls/addFullScreenButton.js";
import { setupWindow } from "./utils/app/initialization/setupWindow.js";
import { renderChartJS } from "./utils/charts/core/renderChartJS.js";

// State Management Integration
import { getState, setState } from "./utils/state/core/stateManager.js";
import { UIActions } from "./utils/state/domain/uiStateManager.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { fitFileStateManager } from "./utils/state/domain/fitFileState.js";
import { performanceMonitor } from "./utils/debug/stateDevTools.js";
import { showNotification } from "./utils/ui/notifications/showNotification.js";
import { chartTabIntegration } from "./utils/charts/core/chartTabIntegration.js";

// Constants
const CONSTANTS = {
    SUMMARY_COLUMN_SELECTOR_DELAY: 100,
    IFRAME_PATHS: {
        ALT_FIT: "libs/ffv/index.html",
    },
    DOM_IDS: {
        ALT_FIT_IFRAME: "altfit-iframe",
        ZWIFT_IFRAME: "zwift-iframe",
        DROP_OVERLAY: "drop-overlay",
        ACTIVE_FILE_NAME: "activeFileName",
        ACTIVE_FILE_NAME_CONTAINER: "activeFileNameContainer",
        UNLOAD_FILE_BTN: "unloadFileBtn",
        TAB_CHART: "tab-chart",
        TAB_SUMMARY: "tab-summary",
        CONTENT_MAP: "content-map",
        CONTENT_DATA: "content-data",
        CONTENT_SUMMARY: "content-summary",
    },
    SELECTORS: {
        SUMMARY_GEAR_BTN: ".summary-gear-btn",
    },
};

// Event listener management with state integration
const eventListeners = new Map();

// Make globalData available on window for backwards compatibility
Object.defineProperty(window, "globalData", {
    get() {
        return getState("globalData");
    },
    set(value) {
        setState("globalData", value, { source: "main-ui.js" });
    },
});

// Event listener management with state integration
function addEventListenerWithCleanup(element, event, handler, options = {}) {
    if (!element) return;

    element.addEventListener(event, handler, options);
    const key = `${element.constructor.name}-${event}`;
    if (!eventListeners.has(key)) {
        eventListeners.set(key, []);
    }
    eventListeners.get(key).push({ element, event, handler });
}

function cleanupEventListeners() {
    eventListeners.forEach((listeners) => {
        listeners.forEach(({ element, event, handler }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler);
            }
        });
    });
    eventListeners.clear();
}

// Validation functions
function validateElectronAPI() {
    return window.electronAPI && typeof window.electronAPI.decodeFitFile === "function";
}

function validateElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
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

function clearContentAreas() {
    const contentIds = [
        CONSTANTS.DOM_IDS.CONTENT_MAP,
        CONSTANTS.DOM_IDS.CONTENT_DATA,
        CONSTANTS.DOM_IDS.CONTENT_CHART,
        CONSTANTS.DOM_IDS.CONTENT_SUMMARY,
    ];

    contentIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = "";
        }
    });
}

function unloadFitFile() {
    const operationId = `unload_file_${Date.now()}`;

    // Start performance monitoring
    if (performanceMonitor?.isEnabled()) {
        performanceMonitor.startTimer(operationId);
    }

    try {
        // Clear global data using state management
        AppActions.clearGlobalData();

        // Update file state
        if (fitFileStateManager) {
            fitFileStateManager.handleFileLoaded(null);
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
        if (window.electronAPI && window.electronAPI.send) {
            window.electronAPI.send("fit-file-loaded", null);
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
        if (performanceMonitor?.isEnabled()) {
            performanceMonitor.endTimer(operationId);
        }
    }
}

// Expose essential functions to window for backward compatibility
window.showFitData = showFitData;
// Note: renderChartJS is now handled through chartStateManager, but exposed for legacy compatibility
window.renderChartJS = renderChartJS;
window.cleanupEventListeners = cleanupEventListeners;

// Enhanced iframe communication with better error handling
window.sendFitFileToAltFitReader = async function (arrayBuffer) {
    const iframe = validateElement(CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
    if (!iframe) {
        console.warn("Alt FIT iframe not found");
        return;
    }

    // If iframe is not loaded yet, wait for it to load before posting message
    const postToIframe = () => {
        try {
            if (iframe.contentWindow) {
                const base64 = convertArrayBufferToBase64(arrayBuffer);
                iframe.contentWindow.postMessage({ type: "fit-file", base64 }, "*");
            }
        } catch (error) {
            console.error("Error posting message to iframe:", error);
        }
    };

    if (!iframe.src || !iframe.src.includes(CONSTANTS.IFRAME_PATHS.ALT_FIT)) {
        iframe.src = CONSTANTS.IFRAME_PATHS.ALT_FIT;
        iframe.onload = postToIframe;
    } else if (iframe.contentWindow && iframe.src) {
        postToIframe();
    } else {
        iframe.onload = postToIframe;
    }
};

// Enhanced theme change handling with state management integration
if (
    window.electronAPI &&
    typeof window.electronAPI.onSetTheme === "function" &&
    typeof window.electronAPI.sendThemeChanged === "function"
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
if (window.electronAPI && window.electronAPI.onOpenSummaryColumnSelector === undefined) {
    window.electronAPI.onOpenSummaryColumnSelector = (callback) => {
        if (window.electronAPI && window.electronAPI._summaryColListenerAdded !== true) {
            window.electronAPI._summaryColListenerAdded = true;
            window.electronAPI.onIpc("open-summary-column-selector", callback);
        }
    };
}

// Register handler to show summary column selector from menu
if (window.electronAPI && window.electronAPI.onIpc) {
    window.electronAPI.onIpc("open-summary-column-selector", () => {
        try {
            // Switch to summary tab if not already active
            const tabSummary = validateElement(CONSTANTS.DOM_IDS.TAB_SUMMARY);
            if (tabSummary && !tabSummary.classList.contains("active")) {
                tabSummary.click();
            }

            // Wait for renderSummary to finish, then open the column selector
            setTimeout(function () {
                const gearBtn = document.querySelector(CONSTANTS.SELECTORS.SUMMARY_GEAR_BTN);
                if (gearBtn) {
                    gearBtn.click();
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
if (window.electronAPI && window.electronAPI.onIpc) {
    window.electronAPI.onIpc("unload-fit-file", unloadFitFile);
}

// Unload file when the red X is clicked
const unloadBtn = validateElement(CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN);
if (unloadBtn) {
    unloadBtn.onclick = unloadFitFile;
}

// Tab button state is now managed automatically by the state management system
// in utils/ui/controls/enableTabButtons.js

// Enhanced Drag and Drop UI and Global Handling with State Management
class DragDropHandler {
    constructor() {
        this.setupEventListeners();
        // Initialize drag counter in state
        setState("ui.dragCounter", 0, { source: "DragDropHandler" });
    }

    showDropOverlay() {
        const dropOverlay = validateElement(CONSTANTS.DOM_IDS.DROP_OVERLAY);
        if (dropOverlay) dropOverlay.style.display = "flex";

        const iframe = validateElement(CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
        if (iframe) iframe.style.pointerEvents = "none";

        const zwiftIframe = validateElement(CONSTANTS.DOM_IDS.ZWIFT_IFRAME);
        if (zwiftIframe) zwiftIframe.style.pointerEvents = "none";
    }

    hideDropOverlay() {
        const dropOverlay = validateElement(CONSTANTS.DOM_IDS.DROP_OVERLAY);
        if (dropOverlay) dropOverlay.style.display = "none";

        const iframe = validateElement(CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
        if (iframe) iframe.style.pointerEvents = "";

        const zwiftIframe = validateElement(CONSTANTS.DOM_IDS.ZWIFT_IFRAME);
        if (zwiftIframe) zwiftIframe.style.pointerEvents = "";
    }

    async processDroppedFile(file) {
        const operationId = `process_dropped_file_${Date.now()}`;

        // Start performance monitoring
        if (performanceMonitor?.isEnabled()) {
            performanceMonitor.startTimer(operationId);
        }

        if (!file || !file.name.toLowerCase().endsWith(".fit")) {
            const message = "Only .fit files are supported. Please drop a valid .fit file.";
            alert(message);
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
            if (!arrayBuffer) return;

            if (!validateElectronAPI()) {
                const message = "FIT file decoding is not supported in this environment.";
                alert(message);
                showNotification(message, "error");
                return;
            }

            const fitData = await window.electronAPI.decodeFitFile(arrayBuffer);
            if (fitData && !fitData.error) {
                showFitData(fitData, file.name);
                window.sendFitFileToAltFitReader(arrayBuffer);
                showNotification(`File "${file.name}" loaded successfully`, "success");
            } else {
                const errorMessage =
                    "Unable to process the FIT file. Please try again or check the file format. Details: " +
                    (fitData.error || "Unknown error");
                alert(errorMessage);
                showNotification("Failed to load FIT file", "error");

                // Handle error in state manager
                if (fitFileStateManager) {
                    fitFileStateManager.handleFileLoadingError(new Error(fitData.error || "Unknown error"));
                }
            }
        } catch (error) {
            console.error("[main-ui] Error processing dropped file:", error);
            const message = "An unexpected error occurred while processing the FIT file.";
            alert(message);
            showNotification(message, "error");

            // Handle error in state manager
            if (fitFileStateManager) {
                fitFileStateManager.handleFileLoadingError(error);
            }
        } finally {
            // Clear loading state
            AppActions.setFileOpening(false);

            // End performance monitoring
            if (performanceMonitor?.isEnabled()) {
                performanceMonitor.endTimer(operationId);
            }
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
    setupEventListeners() {
        // Show overlay on dragenter, hide on dragleave/drop
        addEventListenerWithCleanup(window, "dragenter", (e) => {
            if (e.target === document || e.target === document.body) {
                const currentCounter = getState("ui.dragCounter") || 0;
                setState("ui.dragCounter", currentCounter + 1, { source: "DragDropHandler" });
                this.showDropOverlay();
            }
        });

        addEventListenerWithCleanup(window, "dragleave", (e) => {
            if (e.target === document || e.target === document.body) {
                const currentCounter = getState("ui.dragCounter") || 0;
                const newCounter = currentCounter - 1;
                setState("ui.dragCounter", newCounter, { source: "DragDropHandler" });
                if (newCounter <= 0) {
                    this.hideDropOverlay();
                    setState("ui.dragCounter", 0, { source: "DragDropHandler" });
                }
            }
        });

        addEventListenerWithCleanup(window, "dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            this.showDropOverlay();
        });

        addEventListenerWithCleanup(window, "drop", async (e) => {
            setState("ui.dragCounter", 0, { source: "DragDropHandler" });
            this.hideDropOverlay();
            e.preventDefault();

            if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
                const message = "No valid files detected. Please drop a .fit file.";
                alert(message);
                showNotification(message, "warning");
                return;
            }

            await this.processDroppedFile(e.dataTransfer.files[0]);
        });

        // Prevent iframe from blocking drag/drop events if drag-and-drop is enabled
        if (window.enableDragAndDrop) {
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
                alert("Please drop files outside the iframe to process them.");
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
                alert("Please drop files outside the ZwiftMap iframe to process them.");
            });
        }
    }
}

// Initialize drag and drop handler
const dragDropHandler = new DragDropHandler();

// Expose dragDropHandler for cleanup if needed
window.dragDropHandler = dragDropHandler;

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
    document.addEventListener("click", (e) => {
        const link = e.target.closest('[data-external-link="true"]');
        if (link) {
            handleExternalLink(e, link);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            const link = e.target.closest('[data-external-link="true"]');
            if (link) {
                handleExternalLink(e, link);
            }
        }
    });

    function handleExternalLink(e, link) {
        e.preventDefault();
        const url = link.getAttribute("href");
        if (url && window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(url).catch((error) => {
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
window.injectMenu = function (theme = null, fitFilePath = null) {
    try {
        if (window.electronAPI && typeof window.electronAPI.injectMenu === "function") {
            window.electronAPI.injectMenu(theme, fitFilePath);
            console.log("[injectMenu] Requested menu injection with theme:", theme, "fitFilePath:", fitFilePath);
        } else {
            console.warn("[injectMenu] electronAPI.injectMenu is not available.");
        }
    } catch (error) {
        console.error("[injectMenu] Error during menu injection:", error);
    }
};

// Add cleanup function to development helpers with state management integration
window.devCleanup = function () {
    cleanupEventListeners();

    // Clear state using the new system
    AppActions.clearGlobalData();
    setState("charts.isRendered", false, { source: "devCleanup" });
    setState("ui.dragCounter", 0, { source: "devCleanup" });

    // Clean up our new state managers
    if (window.chartTabIntegration) {
        window.chartTabIntegration.destroy();
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
// chartTabIntegration is a singleton that self-initializes and brings in the other managers
console.log("[main-ui] Chart tab integration:", chartTabIntegration?.getStatus?.() || "Not available");

console.log("[main-ui] State managers initialized successfully");
