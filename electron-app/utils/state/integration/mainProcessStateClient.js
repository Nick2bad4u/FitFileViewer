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
class MainProcessStateClient {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();

        /** @type {boolean} */
        this._isInitialized = false;

        this._init();
    }

    /**
     * Initialize the client
     * @private
     */
    _init() {
        if (this._isInitialized) {
            return;
        }

        // Verify electronAPI is available
        if (globalThis.window === undefined || !globalThis.electronAPI) {
            console.warn("[MainProcessStateClient] electronAPI not available - client will be in degraded mode");
            return;
        }

        this._isInitialized = true;

        // Safe check for development mode in renderer process
        const isDevelopment = typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development";

        if (isDevelopment) {
            console.log("[MainProcessStateClient] Initialized successfully");
        }
    }

    /**
     * Get a value from main process state
     * @param {string} [path] - Optional path to specific state property
     * @returns {Promise<any>}
     */
    async get(path) {
        if (!this.isAvailable()) {
            throw new Error("MainProcessStateClient is not available");
        }

        try {
            return await globalThis.electronAPI.getMainState(path);
        } catch (error) {
            console.error(`[MainProcessStateClient] Error getting state${path ? ` at path "${path}"` : ""}:`, error);
            throw error;
        }
    }

    /**
     * Get diagnostic information
     * @returns {Promise<{errors: ErrorEntry[], operations: Record<string, Operation>, metrics: Metrics}>}
     */
    async getDiagnostics() {
        const [errors, operations, metrics] = await Promise.all([
            this.getErrors(),
            this.getOperations(),
            this.getMetrics(),
        ]);

        return { errors, operations, metrics };
    }

    /**
     * Get recent errors
     * @param {number} [limit=50] - Maximum number of errors to retrieve
     * @returns {Promise<ErrorEntry[]>}
     */
    async getErrors(limit = 50) {
        if (!this.isAvailable()) {
            throw new Error("MainProcessStateClient is not available");
        }

        try {
            return await globalThis.electronAPI.getErrors(limit);
        } catch (error) {
            console.error("[MainProcessStateClient] Error getting errors:", error);
            throw error;
        }
    }

    /**
     * Get the Gyazo server state
     * @returns {Promise<{server: any, port: number|null}>}
     */
    async getGyazoServerState() {
        const [server, port] = await Promise.all([this.get("gyazoServer"), this.get("gyazoServerPort")]);

        return { server, port };
    }

    /**
     * Get the currently loaded FIT file path
     * @returns {Promise<string|null>}
     */
    async getLoadedFilePath() {
        return this.get("loadedFitFilePath");
    }

    /**
     * Get the main window reference
     * @returns {Promise<any>}
     */
    async getMainWindow() {
        return this.get("mainWindow");
    }

    /**
     * Get performance metrics
     * @returns {Promise<Metrics>}
     */
    async getMetrics() {
        if (!this.isAvailable()) {
            throw new Error("MainProcessStateClient is not available");
        }

        try {
            return await globalThis.electronAPI.getMetrics();
        } catch (error) {
            console.error("[MainProcessStateClient] Error getting metrics:", error);
            throw error;
        }
    }

    /**
     * Get the status of a specific operation
     * @param {string} operationId - Operation identifier
     * @returns {Promise<Operation|null>}
     */
    async getOperation(operationId) {
        if (!this.isAvailable()) {
            throw new Error("MainProcessStateClient is not available");
        }

        try {
            return await globalThis.electronAPI.getOperation(operationId);
        } catch (error) {
            console.error(`[MainProcessStateClient] Error getting operation "${operationId}":`, error);
            throw error;
        }
    }

    /**
     * Get all operations
     * @returns {Promise<Record<string, Operation>>}
     */
    async getOperations() {
        if (!this.isAvailable()) {
            throw new Error("MainProcessStateClient is not available");
        }

        try {
            return await globalThis.electronAPI.getOperations();
        } catch (error) {
            console.error("[MainProcessStateClient] Error getting operations:", error);
            throw error;
        }
    }

    /**
     * Check if the client is properly initialized
     * @returns {boolean}
     */
    isAvailable() {
        return this._isInitialized && globalThis.window !== undefined && Boolean(globalThis.electronAPI);
    }

    /**
     * Listen for changes to a specific state path
     * @param {string} path - Path to listen to
     * @param {(change: StateChangeEvent) => void} callback - Callback for state changes
     * @returns {Promise<() => void>} Unsubscribe function
     */
    async listen(path, callback) {
        if (!this.isAvailable()) {
            throw new Error("MainProcessStateClient is not available");
        }

        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function");
        }

        // Store the listener locally
        if (!this._listeners.has(path)) {
            this._listeners.set(path, new Set());
        }
        this._listeners.get(path)?.add(callback);

        // Register with main process
        await globalThis.electronAPI.listenToMainState(path, callback);

        // Return unsubscribe function
        return () => {
            const listeners = this._listeners.get(path);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this._listeners.delete(path);
                }
            }
        };
    }

    /**
     * Set a value in main process state (restricted to allowed paths)
     * Allowed paths: 'loadedFitFilePath', 'operations.*'
     * @param {string} path - Path to the state property
     * @param {any} value - Value to set
     * @param {Object} [options] - Optional metadata
     * @returns {Promise<boolean>} True if successful
     */
    async set(path, value, options = {}) {
        if (!this.isAvailable()) {
            throw new Error("MainProcessStateClient is not available");
        }

        try {
            const result = await globalThis.electronAPI.setMainState(path, value, options);
            if (!result) {
                console.warn(
                    `[MainProcessStateClient] Failed to set "${path}" - path may be restricted. ` +
                        `Only 'loadedFitFilePath' and 'operations.*' paths can be set from renderer.`
                );
            }
            return result;
        } catch (error) {
            console.error(`[MainProcessStateClient] Error setting state at path "${path}":`, error);
            throw error;
        }
    }

    /**
     * Set the currently loaded FIT file path
     * @param {string|null} filePath - File path or null to clear
     * @returns {Promise<boolean>}
     */
    async setLoadedFilePath(filePath) {
        return this.set("loadedFitFilePath", filePath, { source: "renderer" });
    }
}

// Create and export singleton instance
const mainProcessStateClient = new MainProcessStateClient();

// Export both the class and the singleton
export { MainProcessStateClient, mainProcessStateClient };

// Also provide a default export for convenience
export default mainProcessStateClient;
