import { LoadingOverlay } from "./LoadingOverlay.js";
import { loadOverlayFiles } from "./loadOverlayFiles.js";
import { showNotification } from "./showNotification.js";

/**
 * File selector configuration
 * @readonly
 */
const FILE_SELECTOR_CONFIG = {
    INPUT_TYPE: "file",
    ACCEPTED_EXTENSIONS: ".fit",
    MULTIPLE_FILES: true,
    HIDDEN_STYLES: "display: none;",
    ERROR_MESSAGES: {
        FILE_LOADING_FAILED: "Failed to load FIT files",
        FILE_SELECTION_ERROR: "Error during file selection:",
        NO_FILES_SELECTED: "No files selected",
    },
    LOG_PREFIX: "[openFileSelector]",
};

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
    input.type = FILE_SELECTOR_CONFIG.INPUT_TYPE;
    input.accept = FILE_SELECTOR_CONFIG.ACCEPTED_EXTENSIONS;
    input.multiple = FILE_SELECTOR_CONFIG.MULTIPLE_FILES;
    input.style.cssText = FILE_SELECTOR_CONFIG.HIDDEN_STYLES;

    return input;
}

/**
 * Sets up the change event handler for the file input
 * @param {HTMLInputElement} input - File input element to configure
 * @private
 */
function setupFileInputHandler(input) {
    input.addEventListener("change", async (event) => {
        try {
            await handleFileSelection(event);
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
 * Handles the file selection event and processes selected files
 * @param {Event} event - Change event from file input
 * @private
 */
async function handleFileSelection(event) {
    const files = event.target.files;

    if (!files || files.length === 0) {
        console.debug(`${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.NO_FILES_SELECTED}`);
        return;
    }

    const fileArray = Array.from(files);
    console.debug(`${FILE_SELECTOR_CONFIG.LOG_PREFIX} Processing ${fileArray.length} selected file(s)`);

    await loadOverlayFiles(fileArray);
}

/**
 * Triggers the file selection dialog and cleans up the input element
 * @param {HTMLInputElement} input - File input element to trigger
 * @private
 */
function triggerFileSelection(input) {
    // Temporarily add to DOM to enable click trigger
    document.body.appendChild(input);

    try {
        input.click();
    } finally {
        // Clean up immediately after triggering
        document.body.removeChild(input);
    }
}
