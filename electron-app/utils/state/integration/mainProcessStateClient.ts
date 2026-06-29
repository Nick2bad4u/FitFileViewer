import {
    MAIN_APP_STATE_KNOWN_PATHS,
    type MainProcessStateListenPath,
    type MainProcessStateReadablePath,
    type MainProcessStateWritablePath,
    type MainStateChange,
    type MainStateIpcValue,
    type MainStateSetOptions,
    type MainStateSetValue,
} from "../../../shared/ipc.js";
import type { ElectronMainStateApi } from "../../../shared/preloadApi.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import {
    getMainProcessStateRuntime,
    type MainProcessStateRuntime,
} from "./mainProcessStateRuntime.js";

type Operation = MainStateIpcValue;
type ErrorEntry = MainStateIpcValue;
type Metrics = MainStateIpcValue;

const mainAppStateKnownPathSet = new Set<string>(MAIN_APP_STATE_KNOWN_PATHS);
const forbiddenPathSegments = new Set([
    "__proto__",
    "constructor",
    "prototype",
]);

/** State change payload delivered by the main-process state bridge. */
export type StateChangeEvent = MainStateChange & {
    metadata?: MainStateIpcValue;
    oldValue?: MainStateIpcValue;
};

type MainStateElectronAPI = {
    readonly getErrors: ElectronMainStateApi["getErrors"];
    readonly getMainState: ElectronMainStateApi["getMainState"];
    readonly getMetrics: ElectronMainStateApi["getMetrics"];
    readonly getOperation: ElectronMainStateApi["getOperation"];
    readonly getOperations: ElectronMainStateApi["getOperations"];
    readonly listenToMainState: ElectronMainStateApi["listenToMainState"];
    readonly setMainState: ElectronMainStateApi["setMainState"];
};

type MainProcessStateClientOptions = {
    electronApiScope?: RendererElectronApiScope | undefined;
};

function mainProcessStateRuntime(): MainProcessStateRuntime {
    return getMainProcessStateRuntime();
}

function isMainStateElectronAPI(value: unknown): value is MainStateElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return [
        "getErrors",
        "getMainState",
        "getMetrics",
        "getOperation",
        "getOperations",
        "listenToMainState",
        "setMainState",
    ].every((key) =>
        hasMainStateElectronFunction(key as keyof MainStateElectronAPI, value)
    );
}

function hasMainStateElectronFunction(
    key: keyof MainStateElectronAPI,
    value: object
): boolean {
    return (
        key in value && typeof value[key as keyof typeof value] === "function"
    );
}

function getMainStateElectronAPI(
    electronApiScope: RendererElectronApiScope | undefined
): MainStateElectronAPI | null {
    return getRendererElectronApi(isMainStateElectronAPI, electronApiScope);
}

function hasForbiddenPathSegment(path: string): boolean {
    return path
        .split(".")
        .some((segment) => forbiddenPathSegments.has(segment));
}

function isOperationPath(path: string): path is `operations.${string}` {
    return (
        path.startsWith("operations.") &&
        path.length > "operations.".length &&
        !hasForbiddenPathSegment(path)
    );
}

function isReadablePath(path: string): path is MainProcessStateReadablePath {
    return mainAppStateKnownPathSet.has(path) || isOperationPath(path);
}

function isWritablePath(path: string): path is MainProcessStateWritablePath {
    return path === "loadedFitFilePath" || isOperationPath(path);
}

function isListenablePath(path: string): path is MainProcessStateListenPath {
    return path === "*" || isReadablePath(path);
}

function assertReadablePath(
    path: string
): asserts path is MainProcessStateReadablePath {
    if (!isReadablePath(path)) {
        throw new TypeError(
            `Unknown readable main process state path: ${path}`
        );
    }
}

function assertListenablePath(
    path: string
): asserts path is MainProcessStateListenPath {
    if (!isListenablePath(path)) {
        throw new TypeError(
            `Unknown listenable main process state path: ${path}`
        );
    }
}

function isMainStateRecord(
    value: MainStateIpcValue
): value is Readonly<Record<string, MainStateIpcValue>> {
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

function toLoadedFilePath(value: MainStateIpcValue): null | string {
    if (value === null || typeof value === "string") {
        return value;
    }

    throw new TypeError("Expected loadedFitFilePath to be a string or null");
}

function toNullablePort(value: MainStateIpcValue): null | number {
    if (value === null) {
        return null;
    }

    if (typeof value === "number" && Number.isInteger(value)) {
        return value;
    }

    throw new TypeError("Expected gyazoServerPort to be an integer or null");
}

/**
 * Renderer-side interface to state held in the Electron main process.
 */
export class MainProcessStateClient {
    private _isInitialized = false;

    private readonly _electronApiScope: RendererElectronApiScope | undefined;

    private readonly _listeners = new Map<
        string,
        Set<(change: StateChangeEvent) => void>
    >();

    public constructor({
        electronApiScope,
    }: MainProcessStateClientOptions = {}) {
        this._electronApiScope = electronApiScope;
        this._init();
    }

    private _init(): void {
        if (this._isInitialized) {
            return;
        }

        if (!this.getElectronAPI()) {
            console.warn(
                "[MainProcessStateClient] electronAPI not available - client will be in degraded mode"
            );
            return;
        }

        this._isInitialized = true;

        if (mainProcessStateRuntime().isDevelopmentEnvironment()) {
            console.log("[MainProcessStateClient] Initialized successfully");
        }
    }

    /**
     * Gets a value from main process state.
     *
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    public async get(
        path?: MainProcessStateReadablePath
    ): Promise<MainStateIpcValue> {
        const electronAPI = this.requireElectronAPI();
        if (path !== undefined) {
            assertReadablePath(path);
        }

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
    public async getGyazoServerState(): Promise<{
        port: null | number;
        server: MainStateIpcValue;
    }> {
        const [server, port] = await Promise.all([
            this.get("gyazoServer"),
            this.get("gyazoServerPort"),
        ]);

        return { port: toNullablePort(port), server };
    }

    /** Gets the currently loaded FIT file path. */
    public async getLoadedFilePath(): Promise<null | string> {
        return toLoadedFilePath(await this.get("loadedFitFilePath"));
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
    public async getOperation(operationId: string): Promise<Operation | null> {
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
        return this._isInitialized && Boolean(this.getElectronAPI());
    }

    /**
     * Listens for changes to a specific main-process state path.
     *
     * @throws TypeError when callback is not a function.
     * @throws Error when the preload state bridge is unavailable or the IPC
     *   call fails.
     */
    public async listen(
        path: MainProcessStateListenPath,
        callback: (change: StateChangeEvent) => void
    ): Promise<() => void> {
        const electronAPI = this.requireElectronAPI();
        assertListenablePath(path);

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
    public async set(
        path: MainProcessStateWritablePath,
        value: MainStateSetValue,
        options: MainStateSetOptions = {}
    ): Promise<boolean> {
        const electronAPI = this.requireElectronAPI();
        if (!isWritablePath(path)) {
            console.warn(
                `[MainProcessStateClient] Refusing to set "${path}" - path is not renderer-writable. ` +
                    "Only 'loadedFitFilePath' and 'operations.*' paths can be set from renderer."
            );
            return false;
        }

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
        const electronAPI = this.getElectronAPI();
        if (!this._isInitialized || !electronAPI) {
            throw new Error("MainProcessStateClient is not available");
        }

        return electronAPI;
    }

    private getElectronAPI(): MainStateElectronAPI | null {
        return getMainStateElectronAPI(this._electronApiScope);
    }
}

/** Singleton renderer-side main process state client. */
export const mainProcessStateClient = new MainProcessStateClient();

export default mainProcessStateClient;
