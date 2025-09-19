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

import { getActiveTabContent } from "../../rendering/helpers/getActiveTabContent.js";
import { addExitFullscreenOverlay } from "./addExitFullscreenOverlay.js";
import { removeExitFullscreenOverlay } from "./removeExitFullscreenOverlay.js";

// Global reference to screenfull library
const // Constants for better maintainability
    FULLSCREEN_BUTTON_ID = "global-fullscreen-btn",
    FULLSCREEN_WRAPPER_ID = "global-fullscreen-btn-wrapper",
    REQUIRED_CONTENT_IDS = ["content-data", "content-map", "content-summary", "content-altfit"],
    { screenfull } = globalThis;

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
        // Only add one global fullscreen button
        if (document.getElementById(FULLSCREEN_WRAPPER_ID)) {
            logWithContext("Fullscreen button already exists, skipping creation");
            return;
        }

        // Validate screenfull availability
        if (!screenfull || !screenfull.isEnabled) {
            logWithContext("Screenfull not available or not enabled", "warn");
            return;
        }
        const wrapper = document.createElement("div");
        wrapper.className = "fullscreen-btn-wrapper";
        wrapper.id = FULLSCREEN_WRAPPER_ID;

        const btn = document.createElement("button");
        btn.id = FULLSCREEN_BUTTON_ID;
        btn.className = "fullscreen-btn improved themed-btn";
        btn.title = "Toggle Full Screen (F11)";
        btn.setAttribute("aria-label", "Toggle full screen mode");
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "0");

        // Ensure button is clickable by setting pointer events
        btn.style.pointerEvents = "auto";

        // Set initial icon state
        btn.innerHTML = `<span class="fullscreen-icon" aria-hidden="true">${createEnterFullscreenIcon()}</span>`;

        // Add click handler with proper error handling
        btn.addEventListener("click", handleFullscreenToggle);

        wrapper.append(btn);
        document.body.append(wrapper);

        logWithContext("Fullscreen button created successfully");
    } catch (error) {
        logWithContext(`Failed to create fullscreen button: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Alternative DOM setup function for backward compatibility
 * Sets up fullscreen functionality when DOM content is loaded
 *
 * @returns {void}
 *
 * @example
 * // Alternative setup method
 * setupDOMContentLoaded();
 *
 * @public
 * @since 1.0.0
 * @deprecated Use setupFullscreenListeners() instead
 */
export function setupDOMContentLoaded() {
    try {
        if (document.readyState === "loading") {
            globalThis.addEventListener("DOMContentLoaded", () => {
                const hasRequiredElements = REQUIRED_CONTENT_IDS.some((id) => document.getElementById(id) !== null);

                if (hasRequiredElements) {
                    addFullScreenButton();
                    logWithContext("Legacy DOM setup: Fullscreen button initialized");
                }
            });
        } else {
            // DOM already loaded
            const hasRequiredElements = REQUIRED_CONTENT_IDS.some((id) => document.getElementById(id) !== null);

            if (hasRequiredElements) {
                addFullScreenButton();
                logWithContext("Legacy DOM setup: Fullscreen button initialized (immediate)");
            }
        }
    } catch (error) {
        logWithContext(`Error in legacy DOM setup: ${/** @type {any} */ (error).message}`, "error");
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
        if (!screenfull || !screenfull.isEnabled) {
            logWithContext("Screenfull not enabled, skipping listener setup", "warn");
            return;
        }

        // Handle fullscreen state changes
        screenfull.on("change", handleFullscreenStateChange);

        // Handle F11 key for fullscreen toggle
        globalThis.addEventListener("keydown", handleKeyboardShortcuts);

        // Setup DOM content loaded handler
        if (document.readyState === "loading") {
            globalThis.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
        } else {
            handleDOMContentLoaded();
        }

        logWithContext("Fullscreen listeners setup completed");
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
 * @returns {string} SVG markup for exit fullscreen icon
 * @private
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
 * @private
 */
function handleDOMContentLoaded() {
    try {
        // Initialize Electron fullscreen state
        const { electronAPI } = globalThis;
        if (electronAPI && typeof electronAPI.setFullScreen === "function") {
            const { setFullScreen } = electronAPI;
            setFullScreen(false);
        }

        // Check if required elements exist and add fullscreen button
        const hasRequiredElements = REQUIRED_CONTENT_IDS.some((id) => document.getElementById(id) !== null);

        if (hasRequiredElements) {
            addFullScreenButton();
            logWithContext("DOM ready: Fullscreen button initialized");
        } else {
            logWithContext("DOM ready: No required content elements found", "warn");
            for (const id of REQUIRED_CONTENT_IDS) {
                if (!document.getElementById(id)) {
                    logWithContext(`Missing element: ${id}`, "warn");
                }
            }
        }
    } catch (error) {
        logWithContext(`Error during DOM content loaded: ${/** @type {any} */ (error).message}`, "error");
    }
}

/**
 * Handles fullscreen state change events
 * @private
 */
function handleFullscreenStateChange() {
    try {
        const activeContent = getActiveTabContent(),
            globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);

        if (screenfull.isFullscreen) {
            // Entering fullscreen
            if (activeContent) {
                addExitFullscreenOverlay(/** @type {HTMLElement} */ (activeContent));
                logWithContext(`Added exit overlay for: ${activeContent.id}`);
            }

            // Update global button state
            if (globalBtn) {
                updateButtonState(globalBtn, true);
            }

            // Update any content-specific buttons
            const contentBtn = activeContent && document.getElementById(`${activeContent.id}-fullscreen-btn`);
            if (contentBtn) {
                updateButtonState(contentBtn, true);
            }
        } else {
            // Exiting fullscreen
            if (activeContent) {
                removeExitFullscreenOverlay(/** @type {HTMLElement} */ (activeContent));
                logWithContext(`Removed exit overlay for: ${activeContent.id}`);
            }

            // Update global button state
            if (globalBtn) {
                updateButtonState(globalBtn, false);
            }

            // Update any content-specific buttons
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
            if (!activeContent) {
                logWithContext("No active content for F11 fullscreen toggle", "warn");
                return;
            }

            if (!screenfull || !screenfull.isEnabled) {
                logWithContext("Screenfull not available for F11 toggle", "warn");
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
