/**
 * @version 1.0.0
 *
 * @file Fullscreen functionality for FitFileViewer application Provides
 *   fullscreen toggle buttons, keyboard shortcuts, and overlay management Part
 *   of the FitFileViewer Electron application utilities
 *
 *   This module manages fullscreen functionality across different tab content
 *   areas, including proper overlay management, keyboard shortcuts, and
 *   accessibility features.
 *
 * @author FitFileViewer
 */
// screenfull is loaded globally from index.html via vendor/screenfull-global.js
// Avoid bare module imports to satisfy CSP and runtime module resolution in Electron
import { getActiveTabContent } from "../../rendering/helpers/getActiveTabContent.js";
import { addExitFullscreenOverlay } from "./addExitFullscreenOverlay.js";
import { removeExitFullscreenOverlay } from "./removeExitFullscreenOverlay.js";
// Constants for better maintainability
const FULLSCREEN_BUTTON_ID = "global-fullscreen-btn";
const FULLSCREEN_WRAPPER_ID = "global-fullscreen-btn-wrapper";
const REQUIRED_CONTENT_IDS = [
    "content-data",
    "content-map",
    "content-summary",
    "content-altfit",
];
const KEYDOWN_HANDLER_KEY = "__ffvFullscreenKeydownHandler";
const NATIVE_FULLSCREEN_HANDLER_KEY = "__ffvNativeFullscreenChangeHandler";
const NATIVE_FULLSCREEN_EVENTS = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
];
let isWindowFullscreenRequested = false;

const getElectronAPI = () =>
    /** @type {{ setFullScreen?: (flag: boolean) => void } | undefined} */ (
        /** @type {any} */ (globalThis).electronAPI
    );
const getScreenfullInstance = () => {
    const { screenfull } = /** @type {any} */ (globalThis);
    return /** @type {import("screenfull").Screenfull | undefined} */ (
        screenfull
    );
};
const getStoredHandler = (key) =>
    /** @type {(event: any) => void | null | undefined} */ (
        /** @type {any} */ (globalThis)[key]
    );
const setStoredHandler = (key, handler) => {
    Object.defineProperty(globalThis, key, {
        configurable: true,
        enumerable: false,
        value: handler ?? null,
        writable: true,
    });
};
const isFullscreenActive = () => {
    const instance = getScreenfullInstance();
    if (instance && instance.isEnabled) {
        return Boolean(instance.isFullscreen);
    }
    const doc = /** @type {any} */ (document);
    return Boolean(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
    );
};

/**
 * Detect whether chart fullscreen is active (native or overlay fallback).
 *
 * @returns {boolean}
 */
const isChartFullscreenActive = () => {
    const doc = /** @type {any} */ (document);
    const fullscreenElement =
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;

    const nativeChartFullscreen =
        fullscreenElement instanceof HTMLElement &&
        fullscreenElement.classList.contains("chart-wrapper");

    const overlayChartFullscreen =
        document.querySelector(".chart-wrapper--overlay-fullscreen") !== null;

    return nativeChartFullscreen || overlayChartFullscreen;
};
/**
 * Adds a global fullscreen toggle button to the application Creates a floating
 * button that allows users to toggle fullscreen mode for the active tab content
 * Only creates one button instance to prevent duplicates
 *
 * @since 1.0.0
 *
 * @example
 *     // Add fullscreen button when app initializes
 *     addFullScreenButton();
 *
 * @returns {void}
 *
 * @public
 */
export function addFullScreenButton() {
    try {
        if (document.getElementById(FULLSCREEN_WRAPPER_ID)) {
            logWithContext(
                "Fullscreen button already exists, skipping creation"
            );
            return;
        }
        const screenfull = getScreenfullInstance();
        if (!screenfull || !screenfull.isEnabled) {
            const wrapper = document.createElement("div");
            wrapper.className = "fullscreen-btn-wrapper";
            wrapper.id = FULLSCREEN_WRAPPER_ID;
            const btn = document.createElement("button");
            btn.id = FULLSCREEN_BUTTON_ID;
            btn.className = "fullscreen-btn improved themed-btn";
            btn.dataset.tooltip = "Fullscreen (F11)";
            btn.setAttribute("aria-label", "Toggle full screen mode");
            btn.setAttribute("role", "button");
            btn.setAttribute("tabindex", "0");
            btn.style.pointerEvents = "auto";
            btn.innerHTML = `<span class="fullscreen-icon" aria-hidden="true">${createEnterFullscreenIcon()}</span>`;
            btn.addEventListener("click", () => nativeToggleFullscreen());
            wrapper.append(btn);
            document.body.append(wrapper);
            logWithContext(
                "Screenfull not available or not enabled; using native fullscreen fallback",
                "warn"
            );
            return;
        }
        const wrapper = document.createElement("div");
        wrapper.className = "fullscreen-btn-wrapper";
        wrapper.id = FULLSCREEN_WRAPPER_ID;
        const btn = document.createElement("button");
        btn.id = FULLSCREEN_BUTTON_ID;
        btn.className = "fullscreen-btn improved themed-btn";
        btn.dataset.tooltip = "Fullscreen (F11)";
        btn.setAttribute("aria-label", "Toggle full screen mode");
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "0");
        btn.style.pointerEvents = "auto";
        btn.innerHTML = `<span class="fullscreen-icon" aria-hidden="true">${createEnterFullscreenIcon()}</span>`;
        btn.addEventListener("click", handleFullscreenToggle);
        wrapper.append(btn);
        document.body.append(wrapper);
        logWithContext("Fullscreen button created successfully");
    } catch (error) {
        logWithContext(
            `Failed to create fullscreen button: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Alternative DOM setup function for backward compatibility Sets up fullscreen
 * functionality when DOM content is loaded
 *
 * @deprecated Use setupFullscreenListeners() instead
 *
 * @since 1.0.0
 *
 * @example
 *     // Alternative setup method
 *     setupDOMContentLoaded();
 *
 * @returns {void}
 *
 * @public
 */
export function setupDOMContentLoaded() {
    try {
        if (document.readyState === "loading") {
            globalThis.addEventListener("DOMContentLoaded", () => {
                const hasRequiredElements = REQUIRED_CONTENT_IDS.some(
                    (id) => document.getElementById(id) !== null
                );
                if (hasRequiredElements) {
                    addFullScreenButton();
                    logWithContext(
                        "Legacy DOM setup: Fullscreen button initialized"
                    );
                }
            });
        } else {
            const hasRequiredElements = REQUIRED_CONTENT_IDS.some(
                (id) => document.getElementById(id) !== null
            );
            if (hasRequiredElements) {
                addFullScreenButton();
                logWithContext(
                    "Legacy DOM setup: Fullscreen button initialized (immediate)"
                );
            }
        }
    } catch (error) {
        logWithContext(
            `Error in legacy DOM setup: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Sets up fullscreen event listeners for state changes and keyboard shortcuts
 * Handles fullscreen state changes, F11 key events, and initialization
 *
 * @since 1.0.0
 *
 * @example
 *     // Setup listeners after DOM is ready
 *     setupFullscreenListeners();
 *
 * @returns {void}
 *
 * @public
 */
export function setupFullscreenListeners() {
    try {
        const screenfull = getScreenfullInstance();
        const previousKeyHandler = getStoredHandler(KEYDOWN_HANDLER_KEY);
        if (typeof previousKeyHandler === "function") {
            globalThis.removeEventListener("keydown", previousKeyHandler);
        }
        const previousNativeHandler = getStoredHandler(
            NATIVE_FULLSCREEN_HANDLER_KEY
        );
        if (typeof previousNativeHandler === "function") {
            for (const evt of NATIVE_FULLSCREEN_EVENTS) {
                document.removeEventListener(evt, previousNativeHandler);
            }
        }
        globalThis.removeEventListener(
            "DOMContentLoaded",
            handleDOMContentLoaded
        );
        if (screenfull && screenfull.isEnabled) {
            if (typeof screenfull.off === "function") {
                try {
                    screenfull.off("change", handleFullscreenStateChange);
                } catch (error) {
                    void error;
                    /* ignore off errors */
                }
            }
            screenfull.on("change", handleFullscreenStateChange);
            const keyHandler = (event) => handleKeyboardShortcuts(event);
            globalThis.addEventListener("keydown", keyHandler);
            setStoredHandler(KEYDOWN_HANDLER_KEY, keyHandler);
            setStoredHandler(NATIVE_FULLSCREEN_HANDLER_KEY, null);
            if (document.readyState === "loading") {
                globalThis.addEventListener(
                    "DOMContentLoaded",
                    handleDOMContentLoaded
                );
            } else {
                handleDOMContentLoaded();
            }
            logWithContext("Fullscreen listeners setup completed (screenfull)");
            return;
        }
        const nativeHandler = () => {
            try {
                handleFullscreenStateChange();
            } catch (error) {
                logWithContext(
                    `Error in native fullscreen change handler: ${/** @type {any} */ (error).message}`,
                    "error"
                );
            }
        };
        for (const evt of NATIVE_FULLSCREEN_EVENTS) {
            document.addEventListener(evt, nativeHandler);
        }
        setStoredHandler(NATIVE_FULLSCREEN_HANDLER_KEY, nativeHandler);
        const keyHandler = (event) => handleKeyboardShortcuts(event);
        globalThis.addEventListener("keydown", keyHandler);
        setStoredHandler(KEYDOWN_HANDLER_KEY, keyHandler);
        if (document.readyState === "loading") {
            globalThis.addEventListener(
                "DOMContentLoaded",
                handleDOMContentLoaded
            );
        } else {
            handleDOMContentLoaded();
        }
        logWithContext(
            "Using native fullscreen listeners (screenfull not enabled)"
        );
    } catch (error) {
        logWithContext(
            `Failed to setup fullscreen listeners: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Creates SVG icon for fullscreen enter state
 *
 * @private
 *
 * @returns {string} SVG markup for enter fullscreen icon
 */
function createEnterFullscreenIcon() {
    return `
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="https://www.w3.org/2000/svg" class="inline-svg">
            <title>Enter Fullscreen</title>
            <path d="M5 9V5H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 5H23V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23 19V23H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 23H5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}
/**
 * Creates SVG icon for fullscreen exit state
 *
 * @private
 *
 * @returns {string} SVG markup for exit fullscreen icon
 */
function createExitFullscreenIcon() {
    return `
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="https://www.w3.org/2000/svg" class="inline-svg">
            <title>Exit Fullscreen</title>
            <path d="M9 5V9H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23 9V5H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 23V19H23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 19V23H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}
/**
 * Handles DOM content loaded initialization
 *
 * @private
 */
function handleDOMContentLoaded() {
    try {
        addFullScreenButton();
        // Watch for file load state changes
        const observer = new MutationObserver(() => {
            updateFullscreenButtonState();
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });
        // Initial state check
        updateFullscreenButtonState();
    } catch (error) {
        logWithContext(
            `Error in DOMContentLoaded handler: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Handles fullscreen state change events
 *
 * @private
 */
function handleFullscreenStateChange() {
    try {
        const activeContent = getActiveTabContent();
        const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
        const screenfull = getScreenfullInstance();
        const fullscreenEnabled = screenfull && screenfull.isEnabled;
        const nativeFullscreen = isFullscreenActive();
        if (nativeFullscreen) {
            isWindowFullscreenRequested = true;
        } else if (
            (!fullscreenEnabled || !Boolean(screenfull?.isFullscreen)) &&
            isWindowFullscreenRequested
        ) {
            isWindowFullscreenRequested = false;
        }
        const isFullscreen =
            isWindowFullscreenRequested ||
            nativeFullscreen ||
            (fullscreenEnabled ? Boolean(screenfull.isFullscreen) : false);
        if (isFullscreen) {
            if (activeContent) {
                addExitFullscreenOverlay(
                    /** @type {HTMLElement} */ (activeContent)
                );
                logWithContext(`Added exit overlay for: ${activeContent.id}`);
            }
            if (globalBtn) {
                updateButtonState(globalBtn, true);
            }
            const contentBtn =
                activeContent &&
                document.getElementById(`${activeContent.id}-fullscreen-btn`);
            if (contentBtn) {
                updateButtonState(contentBtn, true);
            }
        } else {
            if (activeContent) {
                removeExitFullscreenOverlay(
                    /** @type {HTMLElement} */ (activeContent)
                );
                logWithContext(`Removed exit overlay for: ${activeContent.id}`);
            }
            if (globalBtn) {
                updateButtonState(globalBtn, false);
            }
            const contentBtn =
                activeContent &&
                document.getElementById(`${activeContent.id}-fullscreen-btn`);
            if (contentBtn) {
                updateButtonState(contentBtn, false);
            }
        }
    } catch (error) {
        logWithContext(
            `Error handling fullscreen state change: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Handles fullscreen toggle button click events
 *
 * @private
 *
 * @param {Event} event - The click event
 */
function handleFullscreenToggle(event) {
    try {
        event.stopPropagation();
        const activeContent = getActiveTabContent();
        const electronAPI = getElectronAPI();

        if (electronAPI && typeof electronAPI.setFullScreen === "function") {
            isWindowFullscreenRequested = !isWindowFullscreenRequested;
            electronAPI.setFullScreen(isWindowFullscreenRequested);
            logWithContext(
                `${isWindowFullscreenRequested ? "Entering" : "Exiting"} window fullscreen via IPC`
            );

            const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
            if (globalBtn) {
                updateButtonState(globalBtn, isWindowFullscreenRequested);
            }
            return;
        }

        if (!activeContent) {
            logWithContext(
                "No active tab content found for fullscreen toggle",
                "warn"
            );
            nativeToggleFullscreen(document.documentElement);
            return;
        }

        nativeToggleFullscreen(activeContent);
    } catch (error) {
        logWithContext(
            `Failed to toggle fullscreen: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Handles keyboard shortcuts for fullscreen functionality
 *
 * @private
 *
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyboardShortcuts(event) {
    try {
        if (event.key === "Escape") {
            // Let chart-level fullscreen handlers own Escape when chart fullscreen is active.
            if (isChartFullscreenActive()) {
                return;
            }

            const electronAPI = getElectronAPI();
            if (
                electronAPI &&
                typeof electronAPI.setFullScreen === "function" &&
                isWindowFullscreenRequested
            ) {
                event.preventDefault();
                isWindowFullscreenRequested = false;
                electronAPI.setFullScreen(false);
                logWithContext("Escape: Exiting window fullscreen via IPC");

                const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
                if (globalBtn) {
                    updateButtonState(globalBtn, false);
                }

                const activeContent = getActiveTabContent();
                if (activeContent) {
                    removeExitFullscreenOverlay(
                        /** @type {HTMLElement} */ (activeContent)
                    );
                }
                return;
            }
        }

        if (event.key === "F11") {
            event.preventDefault();
            const activeContent = getActiveTabContent();
            const electronAPI = getElectronAPI();

            if (
                electronAPI &&
                typeof electronAPI.setFullScreen === "function"
            ) {
                isWindowFullscreenRequested = !isWindowFullscreenRequested;
                electronAPI.setFullScreen(isWindowFullscreenRequested);
                logWithContext(
                    `F11: ${isWindowFullscreenRequested ? "Entering" : "Exiting"} window fullscreen via IPC`
                );

                const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
                if (globalBtn) {
                    updateButtonState(globalBtn, isWindowFullscreenRequested);
                }
                return;
            }

            if (!activeContent) {
                logWithContext(
                    "No active content for F11 fullscreen toggle; using document root",
                    "warn"
                );
            }
            nativeToggleFullscreen(activeContent ?? document.documentElement);
        }
    } catch (error) {
        logWithContext(
            `Error handling keyboard shortcut: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Logs messages with context for fullscreen operations
 *
 * @private
 *
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 */
function logWithContext(message, level = "info") {
    const prefix = "[FullscreenButton]";
    try {
        switch (level) {
            case "error": {
                console.error(`${prefix} ${message}`);
                break;
            }
            case "warn": {
                console.warn(`${prefix} ${message}`);
                break;
            }
            default: {
                console.log(`${prefix} ${message}`);
            }
        }
    } catch (error) {
        void error;
        // Silently fail if logging encounters an error
    }
}
/**
 * Native fullscreen fallback when screenfull is unavailable
 */
function nativeToggleFullscreen(target) {
    try {
        const overrideTarget = /** @type {HTMLElement | Document} */ (target);
        const activeContent =
            overrideTarget instanceof HTMLElement
                ? overrideTarget
                : getActiveTabContent();
        const doc = /** @type {any} */ (document);
        const docEl = /** @type {any} */ (
            activeContent || document.documentElement
        );
        const isFs = Boolean(
            document.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
        );
        if (isFs) {
            const exit =
                document.exitFullscreen ||
                doc.webkitExitFullscreen ||
                doc.mozCancelFullScreen ||
                doc.msExitFullscreen;
            if (typeof exit === "function") exit.call(document);
            isWindowFullscreenRequested = false;
            logWithContext("Exiting fullscreen mode (native fallback)");
        } else {
            const req =
                docEl.requestFullscreen ||
                docEl.webkitRequestFullscreen ||
                docEl.mozRequestFullScreen ||
                docEl.msRequestFullscreen;
            if (typeof req === "function") req.call(docEl);
            isWindowFullscreenRequested = true;
            logWithContext("Entering fullscreen mode (native fallback)");
        }
    } catch (error) {
        logWithContext(
            `Native fullscreen fallback failed: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
/**
 * Updates the fullscreen button icon and title based on current state
 *
 * @private
 *
 * @param {HTMLElement} button - The fullscreen button element
 * @param {boolean} isFullscreen - Whether currently in fullscreen mode
 */
function updateButtonState(button, isFullscreen) {
    try {
        const icon = button.querySelector(".fullscreen-icon");
        if (!icon) {
            logWithContext("Fullscreen icon element not found", "warn");
            return;
        }
        if (isFullscreen) {
            button.title = "Exit Full Screen (F11)";
            button.setAttribute("aria-label", "Exit full screen mode");
            icon.innerHTML = createExitFullscreenIcon();
        } else {
            button.title = "Toggle Full Screen (F11)";
            button.setAttribute("aria-label", "Enter full screen mode");
            icon.innerHTML = createEnterFullscreenIcon();
        }
    } catch (error) {
        logWithContext(
            `Failed to update button state: ${/** @type {any} */ (error).message}`,
            "error"
        );
    }
}
// logWithContext moved above nativeToggleFullscreen to satisfy lint ordering
/**
 * Updates fullscreen button state based on whether a file is loaded
 *
 * @private
 */
function updateFullscreenButtonState() {
    const btn = document.getElementById(FULLSCREEN_BUTTON_ID);
    if (!btn) return;
    const hasFile = document.body.classList.contains("app-has-file");
    btn.setAttribute("tabindex", hasFile ? "0" : "-1");
    btn.dataset.tooltip = hasFile ? "Fullscreen (F11)" : "Load a file first";
}
