/*
 * Provides integration between the FIT parser and the state management system
 *
 * @version 1.0.0
 *
 * @file FIT Parser Integration Utility
 *
 * @author FitFileViewer Development Team
 */

import { performanceMonitor } from "../../debug/stateDevTools.js";
// Corrected import paths to actual state manager locations
import { masterStateManager } from "../../state/core/masterStateManager.js";
import { getState, setState } from "../../state/core/stateManager.js";
import { fitFileStateManager } from "../../state/domain/fitFileState.js";
import { settingsStateManager } from "../../state/domain/settingsStateManager.js";
import { getFitParseErrorMessage } from "./fitParsePayload.js";
import type { FitParseEnvelope } from "./fitParsePayload.js";
import type {
    ContextBridge,
    IpcMain,
    IpcMainInvokeEvent,
    IpcRenderer,
} from "electron";
import type {
    DecoderOptions,
    FitDecodeResult,
    PartialDecoderOptions,
} from "../../../shared/fit";
import type {
    DecoderOptionsUpdateResult,
    FitParserModule as SharedFitParserModule,
    FitParserStateManagers,
} from "../../../shared/fitParser";

type IntegrationResult = { error?: string; success: boolean };
type DecoderIpcFailure = FitParseEnvelope & {
    success: false;
};
type DecodeWithStateResult = DecoderIpcFailure | FitDecodeResult;
type DecoderOptionsIpcResult = DecoderIpcFailure | DecoderOptionsUpdateResult;

type FitParserModule = Pick<
    SharedFitParserModule,
    | "decodeFitFile"
    | "getCurrentDecoderOptions"
    | "getDefaultDecoderOptions"
    | "initializeStateManagement"
    | "resetDecoderOptions"
    | "updateDecoderOptions"
>;

type DecodeBuffer = ArrayBuffer | Buffer | Uint8Array;
type SettingsManagerFacade = {
    getSetting?: (key: string) => unknown;
};

const DEFAULT_DECODER_OPTIONS: DecoderOptions = {
    applyScaleAndOffset: true,
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
    expandComponents: true,
    expandSubFields: true,
    includeUnknownData: true,
    mergeHeartRates: true,
};

/*
 * @param {unknown} value
 *
 * @returns {PartialDecoderOptions}
 */
function normalizeDecoderOptions(value: unknown): PartialDecoderOptions {
    return isPlainRecord(value) ? (value as PartialDecoderOptions) : {};
}

function loadFitParser(): FitParserModule {
    return require("../../../fitParser.js") as FitParserModule;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFallbackDecoderOptions(): DecoderOptions {
    return { ...DEFAULT_DECODER_OPTIONS };
}

function createFitParserStateManagers(): FitParserStateManagers {
    const operationTimes = new Map<string, number>();

    return {
        fitFileStateManager: {
            getRecordCount(messages) {
                return fitFileStateManager.getRecordCount(messages);
            },
            handleFileLoaded(payload, context) {
                fitFileStateManager.handleFileLoaded(payload.messages, {
                    filePath:
                        context?.filePath ?? payload.metadata.filePath ?? null,
                });
            },
            handleFileLoadingError(error) {
                fitFileStateManager.handleFileLoadingError(error);
            },
            updateLoadingProgress(progress) {
                fitFileStateManager.updateLoadingProgress(progress);
            },
        },
        performanceMonitor: {
            isEnabled: performanceMonitor.isEnabled,
            endTimer(operationId) {
                const duration = performanceMonitor.endTimer(operationId);
                if (typeof duration === "number") {
                    operationTimes.set(operationId, duration);
                }
            },
            getOperationTime(operationId) {
                return operationTimes.get(operationId) ?? null;
            },
            startTimer(operationId) {
                performanceMonitor.startTimer(operationId);
            },
        },
        settingsStateManager: {
            getCategory(category) {
                const stateValue = getState(`settings.${category}`);
                if (isPlainRecord(stateValue)) {
                    return stateValue as PartialDecoderOptions;
                }

                const settingValue = settingsStateManager.getSetting(category);
                return isPlainRecord(settingValue)
                    ? (settingValue as PartialDecoderOptions)
                    : null;
            },
            updateCategory(category, value, options = {}) {
                setState(
                    `settings.${category}`,
                    value,
                    options.silent === undefined
                        ? { source: options.source ?? "FitParserIntegration" }
                        : {
                              silent: options.silent,
                              source: options.source ?? "FitParserIntegration",
                          }
                );
            },
        },
    };
}

function isTrustedFitParserIpcEvent(event: IpcMainInvokeEvent): boolean {
    const senderUrl = event.senderFrame?.url || event.sender?.getURL?.() || "";
    if (!senderUrl) {
        return false;
    }

    try {
        const url = new URL(senderUrl);
        if (url.protocol === "file:" || url.protocol === "app:") {
            return true;
        }

        const isLoopbackHost =
            url.hostname === "localhost" ||
            url.hostname === "127.0.0.1" ||
            url.hostname === "[::1]";
        return url.protocol === "http:" && isLoopbackHost;
    } catch {
        return false;
    }
}

function rejectUntrustedFitParserIpc(
    event: IpcMainInvokeEvent,
    channel: string
): DecoderIpcFailure | null {
    if (isTrustedFitParserIpcEvent(event)) {
        return null;
    }

    console.warn(
        `[FitParserIntegration] Rejected ${channel} from untrusted IPC sender`
    );
    return {
        error: "Untrusted IPC sender",
        success: false,
    };
}

/*
 * Create a wrapper for decodeFitFile that integrates with renderer state This
 * function can be called from the renderer process via IPC
 *
 * @param {Buffer | Uint8Array} fileBuffer - FIT file buffer
 * @param {DecoderOptions} options - Decoder options
 *
 * @returns {Promise<DecoderResult>} Decoded file data or error
 */
/*
 * Decode FIT file and update state
 *
 * @param {Buffer | Uint8Array} fileBuffer
 * @param {DecoderOptions} [options]
 *
 * @returns {Promise<DecoderResult>} Decoder result or error shape
 */
/** Decodes a FIT file and mirrors successful or failed state transitions. */
export async function decodeFitFileWithState(
    fileBuffer: Buffer | Uint8Array,
    options: PartialDecoderOptions = {}
): Promise<DecodeWithStateResult> {
    try {
        const fitParser = loadFitParser(),
            // Decode the file with state management integration
            result = await fitParser.decodeFitFile(fileBuffer, options);

        // If successful, update master state
        const parseErrorMessage = getFitParseErrorMessage(result);
        if (result && !parseErrorMessage && masterStateManager) {
            setState("globalData", result);
            setState("currentFile.status", "loaded");
            setState("currentFile.lastModified", new Date().toISOString());
        }

        return result;
    } catch (error) {
        console.error(
            "[FitParserIntegration] Error in decodeFitFileWithState:",
            error
        );
        const message = error instanceof Error ? error.message : String(error),
            stack = error instanceof Error ? error.stack : undefined;

        // Update state with error
        if (masterStateManager) {
            setState("currentFile.status", "error");
            setState("currentFile.error", {
                message,
                timestamp: new Date().toISOString(),
            });
        }
        return { details: stack ?? null, error: message, success: false };
    }
}

/*
 * Get current decoder options with state management integration
 *
 * @returns {DecoderOptions} Current decoder options
 */
/*
 * Get current decoder options or fallback defaults
 *
 * @returns {DecoderOptions}
 */
/** Reads current decoder options, falling back to parser defaults. */
export function getCurrentDecoderOptionsWithState(): DecoderOptions {
    try {
        const fitParser = loadFitParser();
        return fitParser.getCurrentDecoderOptions();
    } catch (error) {
        console.error(
            "[FitParserIntegration] Error getting decoder options:",
            error
        );
        try {
            const fitParserFallback = loadFitParser();
            return fitParserFallback.getDefaultDecoderOptions();
        } catch {
            return getFallbackDecoderOptions();
        }
    }
}

/*
 * Initialize FIT parser with state management integration
 *
 * @returns {Promise<IntegrationResult>} Success flag and optional error
 */
/** Initializes FIT parser state manager integration. */
export async function initializeFitParserIntegration(): Promise<IntegrationResult> {
    try {
        const fitParser = loadFitParser();

        // Initialize with state management instances
        fitParser.initializeStateManagement(createFitParserStateManagers());

        // Set up decoder options schema in settings if not already present
        try {
            // Attempt to read existing decoder options from settings state (dynamic category not in schema)
            const settingsManager =
                settingsStateManager as SettingsManagerFacade;
            const existingDecoder = settingsManager.getSetting?.("decoder");
            if (existingDecoder == null) {
                const defaultOptions = fitParser.getDefaultDecoderOptions();
                setState("settings.decoder", defaultOptions, {
                    source: "FitParserIntegration",
                });
                console.log(
                    "[FitParserIntegration] Decoder options initialized in settings state"
                );
            }
        } catch (error) {
            console.warn(
                "[FitParserIntegration] Failed to initialize decoder options:",
                error
            );
        }

        console.log(
            "[FitParserIntegration] FIT parser integration initialized successfully"
        );
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
            "[FitParserIntegration] Failed to initialize FIT parser integration:",
            error
        );
        return { error: message, success: false };
    }
}

/*
 * Set up IPC handlers for FIT parser operations (call from main process)
 *
 * @param {Object} ipcMain - Electron IPC main instance
 */
/*
 * Register IPC handlers (main process)
 *
 * @param {import("electron").IpcMain} ipcMain
 */
/** Registers main-process IPC handlers for FIT parser operations. */
export function setupFitParserIPC(ipcMain: IpcMain): void {
    // Handle file decoding requests from renderer using canonical fit:decode channel
    ipcMain.handle(
        "fit:decode",
        // eslint-disable-next-line sdl/no-electron-unchecked-ipc-sender -- Handler rejects untrusted senders via rejectUntrustedFitParserIpc before decoding.
        async (
            event: IpcMainInvokeEvent,
            fileBuffer: DecodeBuffer,
            options: unknown
        ) => {
            const rejection = rejectUntrustedFitParserIpc(event, "fit:decode");
            if (rejection) {
                return rejection;
            }

            // Normalize ArrayBuffer to Uint8Array before forwarding
            let normalized: Buffer | Uint8Array = fileBuffer as
                | Buffer
                | Uint8Array;
            if (fileBuffer instanceof ArrayBuffer) {
                normalized = new Uint8Array(fileBuffer);
            }
            return decodeFitFileWithState(
                normalized,
                normalizeDecoderOptions(options)
            );
        }
    );

    // Handle decoder options updates from renderer
    ipcMain.handle(
        "update-decoder-options",
        // eslint-disable-next-line sdl/no-electron-unchecked-ipc-sender -- Handler rejects untrusted senders via rejectUntrustedFitParserIpc before updating options.
        async (event: IpcMainInvokeEvent, newOptions: unknown) => {
            const rejection = rejectUntrustedFitParserIpc(
                event,
                "update-decoder-options"
            );
            return (
                rejection ||
                updateDecoderOptionsWithState(
                    normalizeDecoderOptions(newOptions)
                )
            );
        }
    );

    // Handle getting current decoder options
    ipcMain.handle(
        "get-decoder-options",
        // eslint-disable-next-line sdl/no-electron-unchecked-ipc-sender -- Handler returns only after rejectUntrustedFitParserIpc allows the sender.
        async (event: IpcMainInvokeEvent) =>
            rejectUntrustedFitParserIpc(event, "get-decoder-options") ||
            getCurrentDecoderOptionsWithState()
    );

    // Handle resetting decoder options
    ipcMain.handle(
        "reset-decoder-options",
        // eslint-disable-next-line sdl/no-electron-unchecked-ipc-sender -- Handler rejects untrusted senders via rejectUntrustedFitParserIpc before resetting options.
        async (event: IpcMainInvokeEvent) => {
            const rejection = rejectUntrustedFitParserIpc(
                event,
                "reset-decoder-options"
            );
            if (rejection) {
                return rejection;
            }

            try {
                const fitParser = loadFitParser();
                return typeof fitParser.resetDecoderOptions === "function"
                    ? await fitParser.resetDecoderOptions()
                    : {
                          error: "resetDecoderOptions not available",
                          success: false,
                      };
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                return { error: message, success: false };
            }
        }
    );

    console.log(
        "[FitParserIntegration] IPC handlers registered for FIT parser operations"
    );
}

/*
 * Set up preload script functions for FIT parser (call from preload script)
 *
 * @param {Object} contextBridge - Electron context bridge
 * @param {Object} ipcRenderer - Electron IPC renderer
 */
/*
 * Expose renderer-safe API in preload
 *
 * @param {import("electron").ContextBridge} contextBridge
 * @param {import("electron").IpcRenderer} ipcRenderer
 */
/** Exposes renderer-safe FIT parser helpers through the preload bridge. */
export function setupFitParserPreload(
    contextBridge: ContextBridge,
    ipcRenderer: IpcRenderer
): void {
    if (
        contextBridge &&
        typeof contextBridge.exposeInMainWorld === "function"
    ) {
        contextBridge.exposeInMainWorld("fitParser", {
            /*
             * Decode a FIT file buffer
             *
             * @param {ArrayBuffer | Uint8Array | Buffer} fileBuffer
             * @param {unknown} [options]
             *
             * @returns {Promise<unknown>}
             */
            decodeFitFile: (fileBuffer: DecodeBuffer, options?: unknown) => {
                // Normalize ArrayBuffer to Uint8Array to satisfy type expectations downstream
                let normalized: Buffer | Uint8Array = fileBuffer as
                    | Buffer
                    | Uint8Array;
                if (fileBuffer instanceof ArrayBuffer) {
                    normalized = new Uint8Array(fileBuffer);
                }
                return ipcRenderer.invoke("fit:decode", normalized, options);
            },
            /*
             * Get current decoder options
             *
             * @returns {Promise<unknown>}
             */
            getDecoderOptions: () => ipcRenderer.invoke("get-decoder-options"),
            /*
             * Reset decoder options to defaults
             *
             * @returns {Promise<unknown>}
             */
            resetDecoderOptions: () =>
                ipcRenderer.invoke("reset-decoder-options"),
            /*
             * Update decoder options
             *
             * @param {unknown} newOptions
             *
             * @returns {Promise<unknown>}
             */
            updateDecoderOptions: (newOptions: unknown) =>
                ipcRenderer.invoke("update-decoder-options", newOptions),
        });
    }

    console.log(
        "[FitParserIntegration] Preload functions exposed for FIT parser"
    );
}

/*
 * Update decoder options through the state management system
 *
 * @param {DecoderOptions} newOptions - New decoder options
 *
 * @returns {Promise<DecoderResult>} Update result
 */
/*
 * Update decoder options via fitParser and emit change events
 *
 * @param {DecoderOptions} newOptions
 *
 * @returns {Promise<DecoderResult>}
 */
/** Updates decoder options and mirrors successful changes into settings state. */
export async function updateDecoderOptionsWithState(
    newOptions: PartialDecoderOptions
): Promise<DecoderOptionsIpcResult> {
    try {
        const fitParser = loadFitParser(),
            result = await fitParser.updateDecoderOptions(newOptions);

        if (result.success && masterStateManager) {
            try {
                setState("settings.decoder", result.options, {
                    source: "FitParserIntegration",
                });
            } catch {
                // Silent: state update failure should not break decoder option update flow
            }
        }

        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
            "[FitParserIntegration] Error updating decoder options:",
            error
        );
        return { error: message, success: false };
    }
}

/*
 * Example usage in renderer process:
 *
 * // Decode a FIT file const result = await
 * window.fitParser.decodeFitFile(fileBuffer);
 *
 * // Update decoder options const updateResult = await
 * window.fitParser.updateDecoderOptions({ applyScaleAndOffset: false,
 * includeUnknownData: true });
 *
 * // Get current options const options = await
 * window.fitParser.getDecoderOptions();
 *
 * // Reset to defaults const resetResult = await
 * window.fitParser.resetDecoderOptions();
 */
