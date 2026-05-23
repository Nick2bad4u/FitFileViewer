function getMainStateElectronAPI() {
    const stateGlobal = globalThis;
    if (stateGlobal.window === undefined) {
        return undefined;
    }
    return stateGlobal.electronAPI ?? stateGlobal.window.electronAPI;
}
function isIpcSerializableRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function toOperationRecord(value) {
    if (!isIpcSerializableRecord(value)) {
        throw new TypeError("Expected main process operations to be a record");
    }
    return { ...value };
}
/**
 * Renderer-side interface to state held in the Electron main process.
 */
export class MainProcessStateClient {
    _isInitialized = false;
    _listeners = new Map();
    constructor() {
        this._init();
    }
    _init() {
        if (this._isInitialized) {
            return;
        }
        if (!getMainStateElectronAPI()) {
            console.warn(
                "[MainProcessStateClient] electronAPI not available - client will be in degraded mode"
            );
            return;
        }
        this._isInitialized = true;
        const isDevelopment =
            typeof process !== "undefined" &&
            Boolean(process.env) &&
            process.env["NODE_ENV"] === "development";
        if (isDevelopment) {
            console.log("[MainProcessStateClient] Initialized successfully");
        }
    }
    /**
     * Gets a value from main process state.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    async get(path) {
        const electronAPI = this.requireElectronAPI();
        try {
            return await electronAPI.getMainState(path);
        } catch (error) {
            console.error(
                `[MainProcessStateClient] Error getting state${path ? ` at path "${path}"` : ""}:`,
                error
            );
            throw error;
        }
    }
    /** Gets diagnostic state from the main process state manager. */
    async getDiagnostics() {
        const [
            errors,
            operations,
            metrics,
        ] = await Promise.all([
            this.getErrors(),
            this.getOperations(),
            this.getMetrics(),
        ]);
        return { errors, metrics, operations };
    }
    /**
     * Gets recent state-manager errors.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    async getErrors(limit = 50) {
        const electronAPI = this.requireElectronAPI();
        try {
            return await electronAPI.getErrors(limit);
        } catch (error) {
            console.error(
                "[MainProcessStateClient] Error getting errors:",
                error
            );
            throw error;
        }
    }
    /** Gets the current Gyazo server state from main process state. */
    async getGyazoServerState() {
        const [server, port] = await Promise.all([
            this.get("gyazoServer"),
            this.get("gyazoServerPort"),
        ]);
        return { port: port, server };
    }
    /** Gets the currently loaded FIT file path. */
    async getLoadedFilePath() {
        return this.get("loadedFitFilePath");
    }
    /** Gets the serialized main window reference from state. */
    async getMainWindow() {
        return this.get("mainWindow");
    }
    /**
     * Gets performance metrics from the main process state manager.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    async getMetrics() {
        const electronAPI = this.requireElectronAPI();
        try {
            return await electronAPI.getMetrics();
        } catch (error) {
            console.error(
                "[MainProcessStateClient] Error getting metrics:",
                error
            );
            throw error;
        }
    }
    /**
     * Gets the status of a specific operation.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    async getOperation(operationId) {
        const electronAPI = this.requireElectronAPI();
        try {
            return await electronAPI.getOperation(operationId);
        } catch (error) {
            console.error(
                `[MainProcessStateClient] Error getting operation "${operationId}":`,
                error
            );
            throw error;
        }
    }
    /**
     * Gets all tracked operations from the main process state manager.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    async getOperations() {
        const electronAPI = this.requireElectronAPI();
        try {
            return toOperationRecord(await electronAPI.getOperations());
        } catch (error) {
            console.error(
                "[MainProcessStateClient] Error getting operations:",
                error
            );
            throw error;
        }
    }
    /** Checks whether the preload state bridge is available. */
    isAvailable() {
        return this._isInitialized && Boolean(getMainStateElectronAPI());
    }
    /**
     * Listens for changes to a specific main-process state path.
     *
     * @throws TypeError when callback is not a function.
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    async listen(path, callback) {
        const electronAPI = this.requireElectronAPI();
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function");
        }
        if (!this._listeners.has(path)) {
            this._listeners.set(path, new Set());
        }
        this._listeners.get(path)?.add(callback);
        await electronAPI.listenToMainState(path, callback);
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
     * Sets a value in renderer-writable main process state.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    async set(path, value, options = {}) {
        const electronAPI = this.requireElectronAPI();
        try {
            const result = await electronAPI.setMainState(path, value, options);
            if (!result) {
                console.warn(
                    `[MainProcessStateClient] Failed to set "${path}" - path may be restricted. ` +
                        "Only 'loadedFitFilePath' and 'operations.*' paths can be set from renderer."
                );
            }
            return result;
        } catch (error) {
            console.error(
                `[MainProcessStateClient] Error setting state at path "${path}":`,
                error
            );
            throw error;
        }
    }
    /** Sets or clears the currently loaded FIT file path. */
    async setLoadedFilePath(filePath) {
        return this.set("loadedFitFilePath", filePath, { source: "renderer" });
    }
    requireElectronAPI() {
        const electronAPI = getMainStateElectronAPI();
        if (!this._isInitialized || !electronAPI) {
            throw new Error("MainProcessStateClient is not available");
        }
        return electronAPI;
    }
}
/** Singleton renderer-side main process state client. */
export const mainProcessStateClient = new MainProcessStateClient();
export default mainProcessStateClient;
