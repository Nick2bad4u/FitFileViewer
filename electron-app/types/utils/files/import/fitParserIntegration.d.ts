/**
 * Initialize FIT parser with state management integration
 * Call this during application startup after state managers are initialized
 */
/**
 * Result object for integration operations
 * @typedef {{success:boolean, error?:string}} IntegrationResult
 */
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
export function decodeFitFileWithState(fileBuffer: Buffer | Uint8Array, options?: Object): Promise<any>;
/**
 * Get current decoder options with state management integration
 * @returns {Object} Current decoder options
 */
/**
 * Get current decoder options or fallback defaults
 * @returns {any}
 */
export function getCurrentDecoderOptionsWithState(): any;
/**
 * Initialize FIT parser with state management integration
 * @returns {Promise<IntegrationResult>} success flag and optional error
 */
export function initializeFitParserIntegration(): Promise<IntegrationResult>;
/**
 * Set up IPC handlers for FIT parser operations (call from main process)
 * @param {Object} ipcMain - Electron IPC main instance
 */
/**
 * Register IPC handlers (main process)
 * @param {import('electron').IpcMain} ipcMain
 */
export function setupFitParserIPC(ipcMain: import("electron").IpcMain): void;
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
export function setupFitParserPreload(contextBridge: any, ipcRenderer: any): void;
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
export function updateDecoderOptionsWithState(newOptions: Object): Promise<any>;
/**
 * Result object for integration operations
 */
export type IntegrationResult = {
    success: boolean;
    error?: string;
};
