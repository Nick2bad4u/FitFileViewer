/**
 * @fileoverview FIT Parser Integration Utility
 * @description Provides integration between the FIT parser and the state management system
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

// Corrected import paths to actual state manager locations
import { masterStateManager } from "../../state/core/masterStateManager.js";
import { settingsStateManager } from "../../state/domain/settingsStateManager.js";
import { fitFileStateManager } from "../../state/domain/fitFileState.js";
import { performanceMonitor } from "../../debug/stateDevTools.js";
import { setState } from "../../state/core/stateManager.js";

/**
 * Initialize FIT parser with state management integration
 * Call this during application startup after state managers are initialized
 */
/**
 * Result object for integration operations
 * @typedef {{success:boolean, error?:string}} IntegrationResult
 */

/**
 * Initialize FIT parser with state management integration
 * @returns {Promise<IntegrationResult>} success flag and optional error
 */
export async function initializeFitParserIntegration() {
    try {
    // Import the fitParser module (Node.js require in main process)
    /** @type {any} */
    // Path: utils/files/import -> utils/files -> utils -> (electron-app root)
    const fitParser = require("../../../fitParser.js");

        // Initialize with state management instances
        fitParser.initializeStateManagement({
            settingsStateManager,
            fitFileStateManager,
            performanceMonitor,
        });

        // Set up decoder options schema in settings if not already present
        try {
            // Attempt to read existing decoder options from settings state (dynamic category not in schema)
            const existingDecoder = /** @type {any} */ (settingsStateManager && settingsStateManager.getSetting ? settingsStateManager.getSetting(/** @type {any} */ ("decoder")) : undefined);
            if (existingDecoder == null) {
                const defaultOptions = typeof fitParser.getDefaultDecoderOptions === "function" ? fitParser.getDefaultDecoderOptions() : {};
                setState("settings.decoder", defaultOptions, { source: "FitParserIntegration" });
                console.log("[FitParserIntegration] Decoder options initialized in settings state");
            }
        } catch (e) {
            console.warn("[FitParserIntegration] Failed to initialize decoder options:", e);
        }

        console.log("[FitParserIntegration] FIT parser integration initialized successfully");
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[FitParserIntegration] Failed to initialize FIT parser integration:", error);
        return { success: false, error: message };
    }
}

/**
 * Create a wrapper for decodeFitFile that integrates with renderer state
 * This function can be called from the renderer process via IPC
 * @param {Buffer|Uint8Array} fileBuffer - FIT file buffer
 * @param {Object} options - Decoder options
 * @returns {Promise<Object>} Decoded file data or error
 */
/**
 * Decode FIT file and update state
 * @param {Buffer|Uint8Array} fileBuffer
 * @param {Object} [options]
 * @returns {Promise<any>} decoder result or error shape
 */
export async function decodeFitFileWithState(fileBuffer, options = {}) {
    try {
    // Import fitParser
    /** @type {any} */
    // Path adjustment same as above
    const fitParser = require("../../../fitParser.js");

        // Decode the file with state management integration
        const result = await fitParser.decodeFitFile(fileBuffer, options);

        // If successful, update master state
        if (result && !result.error) {
            // Update global state with the decoded data
            if (masterStateManager) {
                setState("globalData", result);
                setState("currentFile.status", "loaded");
                setState("currentFile.lastModified", new Date().toISOString());
            }
        }

        return result;
    } catch (error) {
        console.error("[FitParserIntegration] Error in decodeFitFileWithState:", error);
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        // Update state with error
        if (masterStateManager) {
            setState("currentFile.status", "error");
            setState("currentFile.error", {
                message,
                timestamp: new Date().toISOString(),
            });
        }
        return { error: message, details: stack };
    }
}

/**
 * Update decoder options through the state management system
 * @param {Object} newOptions - New decoder options
 * @returns {Promise<Object>} Update result
 */
/**
 * Update decoder options via fitParser and emit change events
 * @param {Object} newOptions
 * @returns {Promise<any>}
 */
export async function updateDecoderOptionsWithState(newOptions) {
    try {
    /** @type {any} */
    // Path adjustment same as above
    const fitParser = require("../../../fitParser.js");
    const result = typeof fitParser.updateDecoderOptions === "function" ? fitParser.updateDecoderOptions(newOptions) : { success: false, error: "updateDecoderOptions not available" };

        if (result.success && masterStateManager) {
            try {
                setState("settings.decoder", result.options, { source: "FitParserIntegration" });
            } catch {}
        }

        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[FitParserIntegration] Error updating decoder options:", error);
        return { success: false, error: message };
    }
}

/**
 * Get current decoder options with state management integration
 * @returns {Object} Current decoder options
 */
/**
 * Get current decoder options or fallback defaults
 * @returns {any}
 */
export function getCurrentDecoderOptionsWithState() {
    try {
        /** @type {any} */
    const fitParser = require("../../../fitParser.js");
        return typeof fitParser.getCurrentDecoderOptions === "function"
            ? fitParser.getCurrentDecoderOptions()
            : (typeof fitParser.getDefaultDecoderOptions === "function" ? fitParser.getDefaultDecoderOptions() : {});
    } catch (error) {
        console.error("[FitParserIntegration] Error getting decoder options:", error);
        try {
            const fitParserFallback = require("../../../fitParser.js");
            return typeof fitParserFallback.getDefaultDecoderOptions === "function" ? fitParserFallback.getDefaultDecoderOptions() : {};
        } catch {
            return {};
        }
    }
}

/**
 * Set up IPC handlers for FIT parser operations (call from main process)
 * @param {Object} ipcMain - Electron IPC main instance
 */
/**
 * Register IPC handlers (main process)
 * @param {import('electron').IpcMain} ipcMain
 */
export function setupFitParserIPC(ipcMain) {
    // Handle file decoding requests from renderer
    ipcMain.handle(
        "decode-fit-file",
        /**
         * @param {import('electron').IpcMainInvokeEvent} _event
         * @param {ArrayBuffer|Uint8Array|Buffer} fileBuffer
         * @param {any} options
         */
        async (_event, fileBuffer, options) => {
            // Normalize ArrayBuffer to Uint8Array before forwarding
            let normalized = fileBuffer;
            if (fileBuffer instanceof ArrayBuffer) {
                normalized = new Uint8Array(fileBuffer);
            }
            return decodeFitFileWithState(/** @type {Uint8Array|Buffer} */ (normalized), options);
        }
    );

    // Handle decoder options updates from renderer
    ipcMain.handle(
        "update-decoder-options",
        /**
         * @param {import('electron').IpcMainInvokeEvent} _event
         * @param {any} newOptions
         */
        async (_event, newOptions) => updateDecoderOptionsWithState(newOptions)
    );

    // Handle getting current decoder options
    ipcMain.handle(
        "get-decoder-options",
        /** @param {import('electron').IpcMainInvokeEvent} _event */
        async (_event) => getCurrentDecoderOptionsWithState()
    );

    // Handle resetting decoder options
    ipcMain.handle("reset-decoder-options", /** @param {import('electron').IpcMainInvokeEvent} _event */ async (_event) => {
        try {
            /** @type {any} */
            const fitParser = require("../../../fitParser.js");
            return typeof fitParser.resetDecoderOptions === "function" ? fitParser.resetDecoderOptions() : { success: false, error: "resetDecoderOptions not available" };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    console.log("[FitParserIntegration] IPC handlers registered for FIT parser operations");
}

/**
 * Set up preload script functions for FIT parser (call from preload script)
 * @param {Object} contextBridge - Electron context bridge
 * @param {Object} ipcRenderer - Electron IPC renderer
 */
/**
 * Expose renderer-safe API in preload
 * @param {import('electron').ContextBridge} contextBridge
 * @param {import('electron').IpcRenderer} ipcRenderer
 */
export function setupFitParserPreload(/** @type {any} */ contextBridge, /** @type {any} */ ipcRenderer) {
    if (contextBridge && typeof contextBridge.exposeInMainWorld === "function") {
        contextBridge.exposeInMainWorld("fitParser", {
            /**
             * Decode a FIT file buffer
             * @param {ArrayBuffer|Uint8Array|Buffer} fileBuffer
             * @param {any} [options]
             * @returns {Promise<any>}
             */
            decodeFitFile: (fileBuffer, options) => {
                // Normalize ArrayBuffer to Uint8Array to satisfy type expectations downstream
                let normalized = fileBuffer;
                if (fileBuffer instanceof ArrayBuffer) {
                    normalized = new Uint8Array(fileBuffer);
                }
                return ipcRenderer.invoke("decode-fit-file", normalized, options);
            },
            /**
             * Update decoder options
             * @param {any} newOptions
             * @returns {Promise<any>}
             */
            updateDecoderOptions: (newOptions) => ipcRenderer.invoke("update-decoder-options", newOptions),
            /**
             * Get current decoder options
             * @returns {Promise<any>}
             */
            getDecoderOptions: () => ipcRenderer.invoke("get-decoder-options"),
            /**
             * Reset decoder options to defaults
             * @returns {Promise<any>}
             */
            resetDecoderOptions: () => ipcRenderer.invoke("reset-decoder-options"),
        });
    }

    console.log("[FitParserIntegration] Preload functions exposed for FIT parser");
}

/**
 * Example usage in renderer process:
 *
 * // Decode a FIT file
 * const result = await window.fitParser.decodeFitFile(fileBuffer);
 *
 * // Update decoder options
 * const updateResult = await window.fitParser.updateDecoderOptions({
 *     applyScaleAndOffset: false,
 *     includeUnknownData: true
 * });
 *
 * // Get current options
 * const options = await window.fitParser.getDecoderOptions();
 *
 * // Reset to defaults
 * const resetResult = await window.fitParser.resetDecoderOptions();
 */
