import type {
    MainStateChange,
    MainStateIpcValue,
    MainStateListener,
    MainStateSetOptions,
    MainStateSetValue,
} from "../../../shared/ipc";
import type { ElectronAPI } from "../../../shared/preloadApi";

type Operation = MainStateIpcValue;
type ErrorEntry = MainStateIpcValue;
type Metrics = MainStateIpcValue;

/** State change payload delivered by the main-process state bridge. */
export type StateChangeEvent = MainStateChange & {
    metadata?: MainStateIpcValue;
    oldValue?: MainStateIpcValue;
};

type MainStateElectronAPI = Pick<
    ElectronAPI,
    | "getErrors"
    | "getMainState"
    | "getMetrics"
    | "getOperation"
    | "getOperations"
    | "listenToMainState"
    | "setMainState"
>;

type MainStateWindow = {
    electronAPI?: MainStateElectronAPI;
};

type MainStateGlobal = typeof globalThis & {
    electronAPI?: MainStateElectronAPI;
    window?: MainStateWindow;
};

function getMainStateElectronAPI(): MainStateElectronAPI | undefined {
    const stateGlobal = globalThis as MainStateGlobal;
    if (stateGlobal.window === undefined) {
        return undefined;
    }

    return stateGlobal.electronAPI ?? stateGlobal.window.electronAPI;
}

function isMainStateRecord(
    value: MainStateIpcValue
): value is { readonly [key: string]: MainStateIpcValue } {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toOperationRecord(
    value: MainStateIpcValue
): Record<string, Operation> {
    if (!isMainStateRecord(value)) {
        throw new TypeError("Expected main process operations to be a record");
    }

    return { ...value };
}

/**
 * Renderer-side interface to state held in the Electron main process.
 */
export class MainProcessStateClient {
    private _isInitialized = false;

    private readonly _listeners = new Map<
        string,
        Set<(change: StateChangeEvent) => void>
    >();

    public constructor() {
        this._init();
    }

    private _init(): void {
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
    public async get(path?: string): Promise<MainStateIpcValue> {
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
    public async getDiagnostics(): Promise<{
        errors: ErrorEntry[];
        metrics: Metrics;
        operations: Record<string, Operation>;
    }> {
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
    public async getErrors(limit = 50): Promise<ErrorEntry[]> {
        const electronAPI = this.requireElectronAPI();

        try {
            return (await electronAPI.getErrors(limit)) as ErrorEntry[];
        } catch (error) {
            console.error(
                "[MainProcessStateClient] Error getting errors:",
                error
            );
            throw error;
        }
    }

    /** Gets the current Gyazo server state from main process state. */
    public async getGyazoServerState(): Promise<{
        port: null | number;
        server: MainStateIpcValue;
    }> {
        const [server, port] = await Promise.all([
            this.get("gyazoServer"),
            this.get("gyazoServerPort"),
        ]);

        return { port: port as null | number, server };
    }

    /** Gets the currently loaded FIT file path. */
    public async getLoadedFilePath(): Promise<null | string> {
        return this.get("loadedFitFilePath") as Promise<null | string>;
    }

    /** Gets the serialized main window reference from state. */
    public async getMainWindow(): Promise<MainStateIpcValue> {
        return this.get("mainWindow");
    }

    /**
     * Gets performance metrics from the main process state manager.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    public async getMetrics(): Promise<Metrics> {
        const electronAPI = this.requireElectronAPI();

        try {
            return (await electronAPI.getMetrics()) as Metrics;
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
    public async getOperation(operationId: string): Promise<Operation | null> {
        const electronAPI = this.requireElectronAPI();

        try {
            return (await electronAPI.getOperation(
                operationId
            )) as Operation | null;
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
    public async getOperations(): Promise<Record<string, Operation>> {
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
    public isAvailable(): boolean {
        return this._isInitialized && Boolean(getMainStateElectronAPI());
    }

    /**
     * Listens for changes to a specific main-process state path.
     *
     * @throws TypeError when callback is not a function.
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    public async listen(
        path: string,
        callback: (change: StateChangeEvent) => void
    ): Promise<() => void> {
        const electronAPI = this.requireElectronAPI();

        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function");
        }

        if (!this._listeners.has(path)) {
            this._listeners.set(path, new Set());
        }

        this._listeners.get(path)?.add(callback);

        await electronAPI.listenToMainState(
            path,
            callback as MainStateListener
        );

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
    public async set(
        path: string,
        value: MainStateSetValue,
        options: MainStateSetOptions = {}
    ): Promise<boolean> {
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
    public async setLoadedFilePath(filePath: null | string): Promise<boolean> {
        return this.set("loadedFitFilePath", filePath, { source: "renderer" });
    }

    private requireElectronAPI(): MainStateElectronAPI {
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
