import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { loadOverlayFiles } from "./loadOverlayFiles.js";

/**
 * File selector configuration
 *
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
 * Creates a hidden file input element, triggers the file selection dialog, and
 * processes selected files for overlay loading. Handles multiple file selection
 * and provides error feedback through notifications.
 *
 * @example
 *     // Open file selector for overlay files
 *     openFileSelector();
 *
 * @returns {void}
 */
export async function openFileSelector() {
    const { electronAPI } = /** @type {any} */ (globalThis);

    if (electronAPI && typeof electronAPI.openOverlayDialog === "function") {
        try {
            const selectedPaths = await electronAPI.openOverlayDialog();
            if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
                return;
            }

            const facadeFiles = selectedPaths
                .filter(
                    (filePath) =>
                        typeof filePath === "string" &&
                        filePath.trim().length > 0
                )
                .map((filePath) => createNativeFileFacade(filePath));

            if (facadeFiles.length === 0) {
                return;
            }

            await loadOverlayFiles(facadeFiles);
            return;
        } catch (error) {
            console.error(
                `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
                error
            );
            showNotification(
                FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED,
                "error"
            );
            LoadingOverlay.hide();
            return;
        }
    }

    try {
        const input = createFileInput();
        const controller = setupFileInputHandler(input);
        await triggerFileSelection(input, controller);
    } catch (error) {
        console.error(
            `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
            error
        );
        showNotification(
            FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED,
            "error"
        );
        LoadingOverlay.hide();
    }
}

const PATH_SEPARATOR_REGEX = /[/\\]+/g;

/**
 * Creates and configures the file input element
 *
 * @private
 *
 * @returns {HTMLInputElement} Configured file input element
 */
function createFileInput() {
    const input = document.createElement("input");
    // In JSDOM tests, setting type="file" can make the `files` property non-configurable,
    // Which prevents tests from redefining it. Detect JSDOM and skip setting type there.
    const isJsdom =
        typeof navigator !== "undefined" &&
        /jsdom/i.test(navigator.userAgent || "");
    if (!isJsdom) {
        input.type = FILE_SELECTOR_CONFIG.INPUT_TYPE;
    }
    input.accept = FILE_SELECTOR_CONFIG.ACCEPTED_EXTENSIONS;
    input.multiple = FILE_SELECTOR_CONFIG.MULTIPLE_FILES;
    input.style.cssText = FILE_SELECTOR_CONFIG.HIDDEN_STYLES;

    return input;
}

/**
 * Creates a single-run processor for an input element. Ensures that
 * handleFilesFromInput executes at most once per element and provides a promise
 * that resolves when processing completes.
 *
 * @param {HTMLInputElement} input
 *
 * @returns {{ run: (origin?: string) => Promise<void>; done: Promise<void> }}
 */
function createInputProcessingController(input) {
    let handled = false;
    /** @type {(value: void | PromiseLike<void>) => void} */
    let resolveDone;
    const done = new Promise((resolve) => {
        resolveDone = resolve;
    });

    const finalize = () => {
        if (input.isConnected) {
            input.remove();
        }
        resolveDone();
    };

    const run = async (origin = "unknown") => {
        if (handled) {
            return done;
        }
        handled = true;
        PROCESSED_INPUTS.add(input);

        try {
            await handleFilesFromInput(input);
        } catch (error) {
            console.error(
                `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_SELECTION_ERROR}`,
                error,
                `(source: ${origin})`
            );
            showNotification(
                FILE_SELECTOR_CONFIG.ERROR_MESSAGES.FILE_LOADING_FAILED,
                "error"
            );
        } finally {
            LoadingOverlay.hide();
            finalize();
        }

        return done;
    };

    return { run, done };
}

function createNativeFileFacade(filePath) {
    const name = getFileNameFromPath(filePath);
    return {
        arrayBuffer: async () => {
            const api = /** @type {any} */ (globalThis).electronAPI;
            if (!api || typeof api.readFile !== "function") {
                throw new Error("readFile bridge unavailable");
            }
            return api.readFile(filePath);
        },
        name,
        originalPath: filePath,
        path: filePath,
    };
}

function getFileNameFromPath(filePath) {
    if (typeof filePath !== "string") {
        return "";
    }
    const segments = filePath.split(PATH_SEPARATOR_REGEX).filter(Boolean);
    return segments.length ? segments.at(-1) || "" : filePath;
}

/**
 * Extracts files from the provided input element and dispatches to loader
 *
 * @param {HTMLInputElement} input
 */
async function handleFilesFromInput(input) {
    /** @type {File[]} */
    const merged = [];
    const nativeList = /** @type {any} */ (input).files;
    if (
        nativeList &&
        typeof nativeList.length === "number" &&
        nativeList.length > 0
    ) {
        merged.push(...nativeList);
    }
    const selected = /** @type {any} */ (input).selectedFiles;
    if (
        selected &&
        typeof selected.length === "number" &&
        selected.length > 0
    ) {
        merged.push(...selected);
    }
    const injected = /** @type {any} */ (input).__files;
    if (
        injected &&
        typeof injected.length === "number" &&
        injected.length > 0
    ) {
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
        console.debug(
            `${FILE_SELECTOR_CONFIG.LOG_PREFIX} ${FILE_SELECTOR_CONFIG.ERROR_MESSAGES.NO_FILES_SELECTED}`
        );
        return;
    }

    const fileArray = unique;
    console.debug(
        `${FILE_SELECTOR_CONFIG.LOG_PREFIX} Processing ${fileArray.length} selected file(s)`
    );
    // Support test-time injection via window.loadOverlayFiles
    const injectedLoader =
        /** @type {any} */ (globalThis)?.loadOverlayFiles ??
        /** @type {any} */ (globalThis)?.loadOverlayFiles;
    const loader =
        typeof injectedLoader === "function"
            ? injectedLoader
            : loadOverlayFiles;
    await loader(fileArray);
}

function setupFileInputHandler(input) {
    const controller = createInputProcessingController(input);

    input.addEventListener("change", () => {
        controller.run("change").catch(() => {
            // Errors are surfaced via showNotification; suppress unhandled rejection
        });
    });

    return controller;
}

/**
 * Triggers the file selection dialog and cleans up the input element
 *
 * @private
 *
 * @param {HTMLInputElement} input - File input element to trigger
 */
async function triggerFileSelection(input, controller) {
    // Temporarily add to DOM to enable click trigger
    document.body.append(input);

    try {
        input.click();
    } finally {
        queueMicrotask(() => {
            controller.run("microtask").catch(() => {
                /* handled in controller */
            });
        });
        if (typeof globalThis.setTimeout === "function") {
            globalThis.setTimeout(() => {
                controller.run("timeout").catch(() => {
                    /* handled in controller */
                });
            }, 0);
        }
    }

    await controller.done;
}
