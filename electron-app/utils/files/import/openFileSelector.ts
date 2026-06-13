import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { getRendererElectronApi } from "../../runtime/electronApiRuntime.js";
import { loadOverlayFiles, type OverlayInputFile } from "./loadOverlayFiles.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import {
    getOpenFileSelectorRuntime,
    type OpenFileSelectorTimer,
} from "./openFileSelectorRuntime.js";

type FileSelectorElectronAPI = Partial<
    Pick<ElectronAPI, "openOverlayDialog" | "readFile">
>;

type NativeFileFacade = OverlayInputFile & {
    arrayBuffer: () => Promise<ArrayBuffer>;
    name: string;
    originalPath: string;
    path: string;
};

type FileSelectorInput = HTMLInputElement & {
    __files?: ArrayLike<File>;
    selectedFiles?: ArrayLike<File>;
};

type InputProcessingController = {
    done: Promise<void>;
    run: (origin?: string) => Promise<void>;
    signal: AbortSignal;
};

/**
 * File selector configuration
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
const PROCESSED_INPUTS = new WeakSet<HTMLInputElement>();

const PATH_SEPARATOR_REGEX = /[/\\]+/g;

/**
 * Opens a file selector dialog for choosing FIT files as overlays
 *
 * Creates a hidden file input element, triggers the file selection dialog, and
 * processes selected files for overlay loading. Handles multiple file selection
 * and provides error feedback through notifications.
 *
 * @example // Open file selector for overlay files. openFileSelector();
 */
export async function openFileSelector(): Promise<void> {
    const electronAPI = getFileSelectorElectronApi();

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

function isFileSelectorElectronApi(
    value: unknown
): value is FileSelectorElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as FileSelectorElectronAPI;
    return (
        typeof api.openOverlayDialog === "function" ||
        typeof api.readFile === "function"
    );
}

function getFileSelectorElectronApi(): FileSelectorElectronAPI | null {
    return getRendererElectronApi<FileSelectorElectronAPI>(
        isFileSelectorElectronApi
    );
}

/**
 * Creates and configures the file input element
 */
function createFileInput(): HTMLInputElement {
    const runtime = getOpenFileSelectorRuntime();
    const input = runtime.createInput();
    // In JSDOM tests, setting type="file" can make the `files` property non-configurable,
    // Which prevents tests from redefining it. Detect JSDOM and skip setting type there.
    if (!runtime.isJsdom()) {
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
 */
function createInputProcessingController(
    input: HTMLInputElement
): InputProcessingController {
    const runtime = getOpenFileSelectorRuntime();
    let handled = false;
    const abortController = runtime.createAbortController();
    let resolveDone: (value: void | PromiseLike<void>) => void = () => {};
    const done = new Promise<void>((resolve) => {
        resolveDone = resolve;
    });

    const finalize = (): void => {
        abortController.abort();
        if (input.isConnected) {
            input.remove();
        }
        resolveDone();
    };

    const run = async (origin = "unknown"): Promise<void> => {
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

    return { done, run, signal: abortController.signal };
}

function createNativeFileFacade(filePath: string): NativeFileFacade {
    const name = getFileNameFromPath(filePath);
    return {
        arrayBuffer: async () => {
            const api = getFileSelectorElectronApi();
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

function getFileNameFromPath(filePath: string): string {
    const segments = filePath.split(PATH_SEPARATOR_REGEX).filter(Boolean);
    return segments.at(-1) ?? filePath;
}

/**
 * Extracts files from the provided input element and dispatches to loader
 */
async function handleFilesFromInput(input: HTMLInputElement): Promise<void> {
    const merged: File[] = [];
    const fileSelectorInput = input as FileSelectorInput;
    appendFileSource(merged, fileSelectorInput.files);
    appendFileSource(merged, fileSelectorInput.selectedFiles);
    appendFileSource(merged, fileSelectorInput.__files);

    // Deduplicate while preserving insertion order — tests may populate multiple sources
    const unique: File[] = [];
    const seen = new Set<File>();
    for (const file of merged) {
        if (!seen.has(file)) {
            seen.add(file);
            unique.push(file);
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
    await loadOverlayFiles(fileArray);
}

function appendFileSource(
    target: File[],
    source: ArrayLike<File> | null | undefined
): void {
    if (!source || typeof source.length !== "number" || source.length <= 0) {
        return;
    }

    for (const file of Array.from(source)) {
        if (file instanceof File) {
            target.push(file);
        }
    }
}

function setupFileInputHandler(
    input: HTMLInputElement
): InputProcessingController {
    const controller = createInputProcessingController(input);

    input.addEventListener(
        "change",
        () => {
            controller.run("change").catch(() => {
                // Errors are surfaced via showNotification; suppress unhandled rejection.
            });
        },
        { signal: controller.signal }
    );

    return controller;
}

/**
 * Triggers the file selection dialog and cleans up the input element
 */
async function triggerFileSelection(
    input: HTMLInputElement,
    controller: InputProcessingController
): Promise<void> {
    const runtime = getOpenFileSelectorRuntime();

    // Temporarily add to DOM to enable click trigger
    runtime.appendToBody(input);

    try {
        input.click();
    } finally {
        runtime.queueMicrotask(() => {
            controller.run("microtask").catch(() => {
                /* handled in controller */
            });
        });
        const timeoutCleanupController = runtime.createAbortController();
        let timeoutHandle: OpenFileSelectorTimer;
        const clearScheduledTimeout = (): void => {
            runtime.clearTimeout(timeoutHandle);
            timeoutCleanupController.abort();
            controller.signal.removeEventListener(
                "abort",
                clearScheduledTimeout
            );
        };
        timeoutHandle = runtime.setTimeout(() => {
            controller.signal.removeEventListener(
                "abort",
                clearScheduledTimeout
            );
            controller.run("timeout").catch(() => {
                /* handled in controller */
            });
        }, 0);
        controller.signal.addEventListener("abort", clearScheduledTimeout, {
            once: true,
            signal: timeoutCleanupController.signal,
        });
    }

    await controller.done;
}
