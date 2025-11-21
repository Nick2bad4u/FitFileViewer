export default mainProcessStateClient;
export type Operation = import("./mainProcessStateManager.js").Operation;
export type ErrorEntry = import("./mainProcessStateManager.js").ErrorEntry;
export type Metrics = import("./mainProcessStateManager.js").Metrics;
export type StateChangeEvent = {
    /**
     * - The path that changed
     */
    path: string;
    /**
     * - The new value
     */
    value: any;
    /**
     * - The previous value
     */
    oldValue: any;
    /**
     * - Optional metadata about the change
     */
    metadata?: Object;
};
/**
 * @fileoverview Main Process State Client for Renderer Process
 * @description Provides a clean API for the renderer process to interact with main process state
 * via the electronAPI exposed by preload.js. This module wraps the IPC communication
 * with a more intuitive interface.
 *
 * @module mainProcessStateClient
 */
/**
 * @typedef {import('./mainProcessStateManager.js').Operation} Operation
 * @typedef {import('./mainProcessStateManager.js').ErrorEntry} ErrorEntry
 * @typedef {import('./mainProcessStateManager.js').Metrics} Metrics
 */
/**
 * @typedef {Object} StateChangeEvent
 * @property {string} path - The path that changed
 * @property {any} value - The new value
 * @property {any} oldValue - The previous value
 * @property {Object} [metadata] - Optional metadata about the change
 */
/**
 * Main Process State Client - Renderer-side interface to main process state
 */
export class MainProcessStateClient {
    /** @type {Map<string, Set<Function>>} */
    _listeners: Map<string, Set<Function>>;
    /** @type {boolean} */
    _isInitialized: boolean;
    /**
     * Initialize the client
     * @private
     */
    private _init;
    /**
     * Get a value from main process state
     * @param {string} [path] - Optional path to specific state property
     * @returns {Promise<any>}
     */
    get(path?: string): Promise<any>;
    /**
     * Get diagnostic information
     * @returns {Promise<{errors: ErrorEntry[], operations: Record<string, Operation>, metrics: Metrics}>}
     */
    getDiagnostics(): Promise<{
        errors: ErrorEntry[];
        operations: Record<string, Operation>;
        metrics: Metrics;
    }>;
    /**
     * Get recent errors
     * @param {number} [limit=50] - Maximum number of errors to retrieve
     * @returns {Promise<ErrorEntry[]>}
     */
    getErrors(limit?: number): Promise<ErrorEntry[]>;
    /**
     * Get the Gyazo server state
     * @returns {Promise<{server: any, port: number|null}>}
     */
    getGyazoServerState(): Promise<{
        server: any;
        port: number | null;
    }>;
    /**
     * Get the currently loaded FIT file path
     * @returns {Promise<string|null>}
     */
    getLoadedFilePath(): Promise<string | null>;
    /**
     * Get the main window reference
     * @returns {Promise<any>}
     */
    getMainWindow(): Promise<any>;
    /**
     * Get performance metrics
     * @returns {Promise<Metrics>}
     */
    getMetrics(): Promise<Metrics>;
    /**
     * Get the status of a specific operation
     * @param {string} operationId - Operation identifier
     * @returns {Promise<Operation|null>}
     */
    getOperation(operationId: string): Promise<Operation | null>;
    /**
     * Get all operations
     * @returns {Promise<Record<string, Operation>>}
     */
    getOperations(): Promise<Record<string, Operation>>;
    /**
     * Check if the client is properly initialized
     * @returns {boolean}
     */
    isAvailable(): boolean;
    /**
     * Listen for changes to a specific state path
     * @param {string} path - Path to listen to
     * @param {(change: StateChangeEvent) => void} callback - Callback for state changes
     * @returns {Promise<() => void>} Unsubscribe function
     */
    listen(path: string, callback: (change: StateChangeEvent) => void): Promise<() => void>;
    /**
     * Set a value in main process state (restricted to allowed paths)
     * Allowed paths: 'loadedFitFilePath', 'operations.*'
     * @param {string} path - Path to the state property
     * @param {any} value - Value to set
     * @param {Object} [options] - Optional metadata
     * @returns {Promise<boolean>} True if successful
     */
    set(path: string, value: any, options?: Object): Promise<boolean>;
    /**
     * Set the currently loaded FIT file path
     * @param {string|null} filePath - File path or null to clear
     * @returns {Promise<boolean>}
     */
    setLoadedFilePath(filePath: string | null): Promise<boolean>;
}
export const mainProcessStateClient: MainProcessStateClient;
//# sourceMappingURL=mainProcessStateClient.d.ts.map
