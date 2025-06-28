/**
 * @fileoverview FIT Parser Integration Utility
 * @description Provides integration between the FIT parser and the state management system
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

import { masterStateManager } from "./masterStateManager.js";
import { settingsStateManager } from "../../state/domain/settingsStateManager.js";
import { fitFileStateManager } from "./fitFileState.js";
import { performanceMonitor } from "../../debug/stateDevTools.js";

/**
 * Initialize FIT parser with state management integration
 * Call this during application startup after state managers are initialized
 */
export async function initializeFitParserIntegration() {
    try {
        // Import the fitParser module (Node.js require in main process)
        const fitParser = require("../fitParser.js");

        // Initialize with state management instances
        fitParser.initializeStateManagement({
            settingsStateManager,
            fitFileStateManager,
            performanceMonitor,
        });

        // Set up decoder options schema in settings if not already present
        if (settingsStateManager && !settingsStateManager.hasCategory("decoder")) {
            const defaultOptions = fitParser.getDefaultDecoderOptions();
            settingsStateManager.setCategory("decoder", defaultOptions);
            console.log("[FitParserIntegration] Decoder options initialized in settings state");
        }

        console.log("[FitParserIntegration] FIT parser integration initialized successfully");
        return { success: true };
    } catch (error) {
        console.error("[FitParserIntegration] Failed to initialize FIT parser integration:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a wrapper for decodeFitFile that integrates with renderer state
 * This function can be called from the renderer process via IPC
 * @param {Buffer|Uint8Array} fileBuffer - FIT file buffer
 * @param {Object} options - Decoder options
 * @returns {Promise<Object>} Decoded file data or error
 */
export async function decodeFitFileWithState(fileBuffer, options = {}) {
    try {
        // Import fitParser
        const fitParser = require("../fitParser.js");

        // Decode the file with state management integration
        const result = await fitParser.decodeFitFile(fileBuffer, options);

        // If successful, update master state
        if (result && !result.error) {
            // Update global state with the decoded data
            if (masterStateManager) {
                masterStateManager.setState("globalData", result);
                masterStateManager.setState("currentFile.status", "loaded");
                masterStateManager.setState("currentFile.lastModified", new Date().toISOString());
            }
        }

        return result;
    } catch (error) {
        console.error("[FitParserIntegration] Error in decodeFitFileWithState:", error);

        // Update state with error
        if (masterStateManager) {
            masterStateManager.setState("currentFile.status", "error");
            masterStateManager.setState("currentFile.error", {
                message: error.message,
                timestamp: new Date().toISOString(),
            });
        }

        return { error: error.message, details: error.stack };
    }
}

/**
 * Update decoder options through the state management system
 * @param {Object} newOptions - New decoder options
 * @returns {Promise<Object>} Update result
 */
export async function updateDecoderOptionsWithState(newOptions) {
    try {
        const fitParser = require("../fitParser.js");
        const result = fitParser.updateDecoderOptions(newOptions);

        if (result.success && masterStateManager) {
            // Notify that decoder options have changed
            masterStateManager.emit("decoder-options-updated", result.options);
        }

        return result;
    } catch (error) {
        console.error("[FitParserIntegration] Error updating decoder options:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current decoder options with state management integration
 * @returns {Object} Current decoder options
 */
export function getCurrentDecoderOptionsWithState() {
    try {
        const fitParser = require("../fitParser.js");
        return fitParser.getCurrentDecoderOptions();
    } catch (error) {
        console.error("[FitParserIntegration] Error getting decoder options:", error);
        const fitParserFallback = require("../fitParser.js");
        return fitParserFallback.getDefaultDecoderOptions();
    }
}

/**
 * Set up IPC handlers for FIT parser operations (call from main process)
 * @param {Object} ipcMain - Electron IPC main instance
 */
export function setupFitParserIPC(ipcMain) {
    // Handle file decoding requests from renderer
    ipcMain.handle("decode-fit-file", async (event, fileBuffer, options) => {
        return await decodeFitFileWithState(fileBuffer, options);
    });

    // Handle decoder options updates from renderer
    ipcMain.handle("update-decoder-options", async (event, newOptions) => {
        return await updateDecoderOptionsWithState(newOptions);
    });

    // Handle getting current decoder options
    ipcMain.handle("get-decoder-options", async () => {
        return getCurrentDecoderOptionsWithState();
    });

    // Handle resetting decoder options
    ipcMain.handle("reset-decoder-options", async () => {
        try {
            const fitParser = require("../fitParser.js");
            return fitParser.resetDecoderOptions();
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    console.log("[FitParserIntegration] IPC handlers registered for FIT parser operations");
}

/**
 * Set up preload script functions for FIT parser (call from preload script)
 * @param {Object} contextBridge - Electron context bridge
 * @param {Object} ipcRenderer - Electron IPC renderer
 */
export function setupFitParserPreload(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld("fitParser", {
        // Decode FIT file
        decodeFitFile: (fileBuffer, options) => ipcRenderer.invoke("decode-fit-file", fileBuffer, options),

        // Manage decoder options
        updateDecoderOptions: (newOptions) => ipcRenderer.invoke("update-decoder-options", newOptions),

        getDecoderOptions: () => ipcRenderer.invoke("get-decoder-options"),

        resetDecoderOptions: () => ipcRenderer.invoke("reset-decoder-options"),
    });

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
