/**
 * @fileoverview Fullscreen functionality for FitFileViewer application
 * Provides fullscreen toggle buttons, keyboard shortcuts, and overlay management
 * Part of the FitFileViewer Electron application utilities
 *
 * This module manages fullscreen functionality across different tab content areas,
 * including proper overlay management, keyboard shortcuts, and accessibility features.
 *
 * @author FitFileViewer
 * @version 1.0.0
 */

// screenfull is loaded globally from index.html via vendor/screenfull-global.js
// Avoid bare module imports to satisfy CSP and runtime module resolution in Electron

import { getActiveTabContent } from "../../rendering/helpers/getActiveTabContent.js";
import { addExitFullscreenOverlay } from "./addExitFullscreenOverlay.js";
import { removeExitFullscreenOverlay } from "./removeExitFullscreenOverlay.js";

// Constants for better maintainability
const FULLSCREEN_BUTTON_ID = "global-fullscreen-btn";
const FULLSCREEN_WRAPPER_ID = "global-fullscreen-btn-wrapper";
const KEYDOWN_HANDLER_KEY = "__ffvFullscreenKeydownHandler";
const NATIVE_FULLSCREEN_HANDLER_KEY = "__ffvNativeFullscreenChangeHandler";
const NATIVE_FULLSCREEN_EVENTS = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];

const getScreenfullInstance = () => {
    const { screenfull } = /** @type {any} */ (globalThis);
    return /** @type {import('screenfull').Screenfull | undefined} */ (screenfull);
};

const getStoredHandler = (key) => /** @type {(event: any) => void | null | undefined} */(/** @type {any} */ (globalThis)[key]);

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
 * Adds a global fullscreen toggle button to the application
 * Creates a floating button that allows users to toggle fullscreen mode for the active tab content
 * Only creates one button instance to prevent duplicates
 *
 * @returns {void}
 *
 * @example
 * // Add fullscreen button when app initializes
 * addFullScreenButton();
 *
 * @public
 * @since 1.0.0
 */
export function addFullScreenButton() {
    try {
        if (document.getElementById(FULLSCREEN_WRAPPER_ID)) {
            logWithContext("Fullscreen button already exists, skipping creation");
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
            btn.dataset.tooltip = "Load a file first";
            btn.setAttribute("aria-label", "Toggle full screen mode");
            btn.setAttribute("role", "button");
            btn.setAttribute("tabindex", "-1");
            btn.disabled = true;
            btn.style.pointerEvents = "auto";
            btn.innerHTML = `<span class="fullscreen-icon" aria-hidden="true">${createEnterFullscreenIcon()}</span>`;
            btn.addEventListener("click", () => nativeToggleFullscreen());

            wrapper.append(btn);
            document.body.append(wrapper);

            logWithContext("Screenfull not available or not enabled; using native fullscreen fallback", "warn");
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "fullscreen-btn-wrapper";
        wrapper.id = FULLSCREEN_WRAPPER_ID;

        const btn = document.createElement("button");
        btn.id = FULLSCREEN_BUTTON_ID;
        btn.className = "fullscreen-btn improved themed-btn";
        btn.dataset.tooltip = "Load a file first";
        btn.setAttribute("aria-label", "Toggle full screen mode");
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "-1");
        btn.disabled = true;
        btn.style.pointerEvents = "auto";
        btn.innerHTML = `<span class="fullscreen-icon" aria-hidden="true">${createEnterFullscreenIcon()}</span>`;
        btn.addEventListener("click", handleFullscreenToggle);

        wrapper.append(btn);
        document.body.append(wrapper);

        logWithContext("Fullscreen button created successfully");
    } catch (error) {
        logWithContext(`Failed to create fullscreen button: ${/** @type {any} */ (error).message}`, "error");
    }
}



/**
 * Sets up fullscreen event listeners for state changes and keyboard shortcuts
 * Handles fullscreen state changes, F11 key events, and initialization
 *
 * @returns {void}
 *
 * @example
 * // Setup listeners after DOM is ready
 * setupFullscreenListeners();
 *
 * @public
 * @since 1.0.0
 */
export function setupFullscreenListeners() {
    try {
        const screenfull = getScreenfullInstance();

        const previousKeyHandler = getStoredHandler(KEYDOWN_HANDLER_KEY);
        if (typeof previousKeyHandler === "function") {
            globalThis.removeEventListener("keydown", previousKeyHandler);
        }

        const previousNativeHandler = getStoredHandler(NATIVE_FULLSCREEN_HANDLER_KEY);
        if (typeof previousNativeHandler === "function") {
            for (const evt of NATIVE_FULLSCREEN_EVENTS) {
                document.removeEventListener(evt, previousNativeHandler);
            }
        }

        globalThis.removeEventListener("DOMContentLoaded", handleDOMContentLoaded);

        if (screenfull && screenfull.isEnabled) {
            if (typeof screenfull.off === "function") {
                try {
                    screenfull.off("change", handleFullscreenStateChange);
                } catch {
                    /* ignore off errors */
                }
            }

            screenfull.on("change", handleFullscreenStateChange);

            const keyHandler = (event) => handleKeyboardShortcuts(event);
            globalThis.addEventListener("keydown", keyHandler);
            setStoredHandler(KEYDOWN_HANDLER_KEY, keyHandler);
            setStoredHandler(NATIVE_FULLSCREEN_HANDLER_KEY, null);

            if (document.readyState === "loading") {
                globalThis.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
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
                logWithContext(`Error in native fullscreen change handler: ${/** @type {any} */ (error).message}`, "error");
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
            globalThis.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
        } else {
            handleDOMContentLoaded();
        }

        logWithContext("Using native fullscreen listeners (screenfull not enabled)");
    } catch (error) {
        logWithContext(`Failed to setup fullscreen listeners: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Creates SVG icon for fullscreen enter state
 * @returns {string} SVG markup for enter fullscreen icon
 * @private
 */
function createEnterFullscreenIcon() {
    return '<iconify-icon icon="flat-color-icons:expand" width="28" height="28"></iconify-icon>';
}

/**
 * Creates SVG icon for fullscreen exit state
 * @returns {string} SVG markup for exit fullscreen icon
 * @private
 */
function createExitFullscreenIcon() {
    return '<iconify-icon icon="flat-color-icons:collapse" width="28" height="28"></iconify-icon>';
}

/**
 * Handles DOM content loaded initialization
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
        logWithContext(`Error in DOMContentLoaded handler: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Handles fullscreen state change events
 * @private
 */
function handleFullscreenStateChange() {
    try {
        const activeContent = getActiveTabContent();
        const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
        const screenfull = getScreenfullInstance();
        const fullscreenEnabled = screenfull && screenfull.isEnabled;
        const isFullscreen = fullscreenEnabled ? Boolean(screenfull.isFullscreen) : isFullscreenActive();

        if (isFullscreen) {
            if (activeContent) {
                addExitFullscreenOverlay(/** @type {HTMLElement} */(activeContent));
                logWithContext(`Added exit overlay for: ${activeContent.id}`);
            }

            if (globalBtn) {
                updateButtonState(globalBtn, true);
            }

            const contentBtn = activeContent && document.getElementById(`${activeContent.id}-fullscreen-btn`);
            if (contentBtn) {
                updateButtonState(contentBtn, true);
            }
        } else {
            if (activeContent) {
                removeExitFullscreenOverlay(/** @type {HTMLElement} */(activeContent));
                logWithContext(`Removed exit overlay for: ${activeContent.id}`);
            }

            if (globalBtn) {
                updateButtonState(globalBtn, false);
            }

            const contentBtn = activeContent && document.getElementById(`${activeContent.id}-fullscreen-btn`);
            if (contentBtn) {
                updateButtonState(contentBtn, false);
            }
        }
    } catch (error) {
        logWithContext(`Error handling fullscreen state change: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Handles fullscreen toggle button click events
 * @param {Event} event - The click event
 * @private
 */
function handleFullscreenToggle(event) {
    try {
        event.stopPropagation();

        const activeContent = getActiveTabContent();
        if (!activeContent) {
            logWithContext("No active tab content found for fullscreen toggle", "warn");
            return;
        }

        const screenfull = getScreenfullInstance();
        if (!screenfull || !screenfull.isEnabled) {
            logWithContext("Screenfull not available for toggle operation", "warn");
            return;
        }

        if (screenfull.isFullscreen) {
            screenfull.exit();
            logWithContext("Exiting fullscreen mode");
        } else {
            screenfull.request(activeContent);
            logWithContext(`Entering fullscreen for: ${activeContent.id}`);
        }
    } catch (error) {
        logWithContext(`Failed to toggle fullscreen: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Handles keyboard shortcuts for fullscreen functionality
 * @param {KeyboardEvent} event - The keyboard event
 * @private
 */
function handleKeyboardShortcuts(event) {
    try {
        if (event.key === "F11") {
            event.preventDefault();

            const activeContent = getActiveTabContent();
            const screenfull = getScreenfullInstance();
            const isScreenfullEnabled = Boolean(screenfull && screenfull.isEnabled);

            if (!isScreenfullEnabled) {
                if (!activeContent) {
                    logWithContext("No active content for F11 fullscreen toggle; using document root", "warn");
                }
                nativeToggleFullscreen(activeContent ?? document.documentElement);
                return;
            }

            if (!activeContent) {
                logWithContext("No active tab content found for fullscreen toggle", "warn");
                return;
            }

            if (screenfull.isFullscreen) {
                screenfull.exit();
                logWithContext("F11: Exiting fullscreen mode");
            } else {
                screenfull.request(activeContent);
                logWithContext(`F11: Entering fullscreen for: ${activeContent.id}`);
            }
        }
    } catch (error) {
        logWithContext(`Error handling keyboard shortcut: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Logs messages with context for fullscreen operations
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 * @private
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
    } catch {
        // Silently fail if logging encounters an error
    }
}

/**
 * Native fullscreen fallback when screenfull is unavailable
 */
function nativeToggleFullscreen(target) {
    try {
        const overrideTarget = /** @type {HTMLElement | Document} */ (target);
        const activeContent = overrideTarget instanceof HTMLElement ? overrideTarget : getActiveTabContent();
        const doc = /** @type {any} */ (document);
        const docEl = /** @type {any} */ (activeContent || document.documentElement);

        const isFs = Boolean(
            document.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
        );
        if (isFs) {
            const exit =
                document.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (typeof exit === "function") exit.call(document);
            logWithContext("Exiting fullscreen mode (native fallback)");
        } else {
            const req =
                docEl.requestFullscreen ||
                docEl.webkitRequestFullscreen ||
                docEl.mozRequestFullScreen ||
                docEl.msRequestFullscreen;
            if (typeof req === "function") req.call(docEl);
            logWithContext("Entering fullscreen mode (native fallback)");
        }
    } catch (error) {
        logWithContext(`Native fullscreen fallback failed: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Updates the fullscreen button icon and title based on current state
 * @param {HTMLElement} button - The fullscreen button element
 * @param {boolean} isFullscreen - Whether currently in fullscreen mode
 * @private
 */
function updateButtonState(button, isFullscreen) {
    try {
        if (!button) {
            logWithContext("Button element not found for state update", "warn");
            return;
        }

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
        logWithContext(`Failed to update button state: ${/** @type {any} */ (error).message}`, "error");
    }
}

// logWithContext moved above nativeToggleFullscreen to satisfy lint ordering

/**
 * Updates fullscreen button state based on whether a file is loaded
 * @private
 */
function updateFullscreenButtonState() {
    const btn = document.getElementById(FULLSCREEN_BUTTON_ID);
    if (!btn) return;

    const hasFile = document.body.classList.contains("app-has-file");

    btn.disabled = !hasFile;
    btn.setAttribute("tabindex", hasFile ? "0" : "-1");
    btn.dataset.tooltip = hasFile ? "Fullscreen (F11)" : "Load a file first";
}
