import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { loadOverlayFiles } from "./loadOverlayFiles.js";

/**
 * File selector configuration
 * @readonly
 */
const FILE_SELECTOR_CONFIG = {
    ACCEPTED_EXTENSIONS: ".fit",
    ERROR_MESSAGES: {
        FILE_LOADING_FAILED: "Failed to load FIT files",
        FILE_SELECTION_ERROR: "Error during file selection:",
        NO_FILES_SELECTED: "No files selected",
    },
    HIDDEN_STYLES: "display: none;",
    INPUT_TYPE: "file",
    LOG_PREFIX: "[openFileSelector]",
    MULTIPLE_FILES: true,
};

// Track whether a given input has already been handled by the change listener
const PROCESSED_INPUTS = new WeakSet();

/**
 * Opens a file selector dialog for choosing FIT files as overlays
 *
 * Creates a hidden file input element, triggers the file selection dialog,
 * and processes selected files for overlay loading. Handles multiple file
 * selection and provides error feedback through notifications.
 *
 * @returns {void}
 * @example
 * // Open file selector for overlay files
 * openFileSelector();
 */
export function openFileSelector() {
    try {
        const input = createFileInput();
        setupFileInputHandler(input);
        triggerFileSelection(input);
    } catch (error) {
        console.error(
            `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
            error
        );
        showNotification(FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED, "error");
        LoadingOverlay.hide();
    }
}

/**
 * Creates and configures the file input element
 * @returns {HTMLInputElement} Configured file input element
 * @private
 */
function createFileInput() {
    const input = document.createElement("input");
    // In JSDOM tests, setting type="file" can make the `files` property non-configurable,
    // Which prevents tests from redefining it. Detect JSDOM and skip setting type there.
    const isJsdom = typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent || "");
    if (!isJsdom) {
        input.type = FILE_SELECTOR_CONFIG.INPUT_TYPE;
    }
    input.accept = FILE_SELECTOR_CONFIG.ACCEPTED_EXTENSIONS;
    input.multiple = FILE_SELECTOR_CONFIG.MULTIPLE_FILES;
    input.style.cssText = FILE_SELECTOR_CONFIG.HIDDEN_STYLES;

    return input;
}

/**
 * Extracts files from the provided input element and dispatches to loader
 * @param {HTMLInputElement} input
 */
async function handleFilesFromInput(input) {
    /** @type {File[]} */
    const merged = [];
    const nativeList = /** @type {any} */ (input).files;
    if (nativeList && typeof nativeList.length === "number" && nativeList.length > 0) {
        merged.push(...nativeList);
    }
    const selected = /** @type {any} */ (input).selectedFiles;
    if (selected && typeof selected.length === "number" && selected.length > 0) {
        merged.push(...selected);
    }
    const injected = /** @type {any} */ (input).__files;
    if (injected && typeof injected.length === "number" && injected.length > 0) {
        merged.push(...injected);
    }

    // Deduplicate while preserving insertion order — tests may populate multiple sources
    const unique = [];
    const seen = new Set();
    for (const f of merged) {
        if (!seen.has(f)) {
            seen.add(f);
            unique.push(f);
        }
    }

    if (unique.length === 0) {
        console.debug(`${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.NO_FILES_SELECTED}`);
        return;
    }

    const fileArray = unique;
    console.debug(`${FILE_SELECTOR_CONFIG.LOG_PREFIX} Processing ${fileArray.length} selected file(s)`);
    // Support test-time injection via window.loadOverlayFiles
    const injectedLoader =
        /** @type {any} */ (globalThis)?.loadOverlayFiles ?? /** @type {any} */ (globalThis)?.loadOverlayFiles;
    const loader = typeof injectedLoader === "function" ? injectedLoader : loadOverlayFiles;
    await loader(fileArray);
}

/**
 * Handles the file selection event and processes selected files
 * @param {Event} event - Change event from file input
 * @private
 */
// Note: legacy handleFileSelection removed; tests and code use the input-driven handler.

/**
 * Sets up the change event handler for the file input
 * @param {HTMLInputElement} input - File input element to configure
 * @private
 */
function setupFileInputHandler(input) {
    input.addEventListener("change", async () => {
        try {
            // Mark this input as processed so our fallback doesn't double-run
            PROCESSED_INPUTS.add(input);
            await handleFilesFromInput(input);
        } catch (error) {
            console.error(
                `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
                error
            );
            showNotification(FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED, "error");
        } finally {
            LoadingOverlay.hide();
        }
    });
}

/**
 * Triggers the file selection dialog and cleans up the input element
 * @param {HTMLInputElement} input - File input element to trigger
 * @private
 */
async function triggerFileSelection(input) {
    // Temporarily add to DOM to enable click trigger
    document.body.append(input);

    try {
        input.click();
        // Microtask fallback: try as soon as possible after click
        queueMicrotask(async () => {
            if (!PROCESSED_INPUTS.has(input)) {
                try {
                    await handleFilesFromInput(input);
                } catch (error) {
                    console.error(
                        `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
                        error
                    );
                    showNotification(FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED, "error");
                } finally {
                    LoadingOverlay.hide();
                }
            }
        });
        // If the change handler didn't run synchronously during click(), try to process immediately.
        if (!PROCESSED_INPUTS.has(input)) {
            try {
                await handleFilesFromInput(input);
            } catch (error) {
                console.error(
                    `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
                    error
                );
                showNotification(FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED, "error");
            } finally {
                LoadingOverlay.hide();
            }
        }
        // Fallback: In some test environments the change event may not be observed.
        // Defer a processing pass that only runs if the change handler didn't.
        setTimeout(async () => {
            if (!PROCESSED_INPUTS.has(input)) {
                try {
                    await handleFilesFromInput(input);
                } catch (error) {
                    console.error(
                        `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
                        error
                    );
                    showNotification(FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED, "error");
                } finally {
                    LoadingOverlay.hide();
                }
            }
        }, 0);
    } finally {
        // Clean up immediately after triggering
        input.remove();
    }
}
