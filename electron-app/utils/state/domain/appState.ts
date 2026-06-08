type StateEventName = (typeof STATE_EVENTS)[keyof typeof STATE_EVENTS];
type StateListener = (data: unknown) => void;
type StateValidator = (newValue: unknown, oldValue: unknown) => boolean;
type Unsubscribe = () => void;

type ChartDomainState = {
    controlsVisible: boolean;
    instances: Map<string, unknown>;
    isRendered: boolean;
    lastRenderTime: number | null;
    visibleFields: Set<string>;
};

type DataDomainState = {
    isLoaded: boolean;
    lastModified: number | null;
    rawFitData: unknown;
    recordCount: number;
};

type ErrorStateEntry = {
    context: string;
    message: string;
    stack?: string;
    timestamp: number;
};

type ErrorDomainState = {
    current: ErrorStateEntry[];
    history: ErrorStateEntry[];
    lastError: ErrorStateEntry | null;
};

type FileDomainState = {
    isOpening: boolean;
    lastOpened: number | null;
    name: string | null;
    path: string | null;
    size: number;
};

type PerformanceDomainState = {
    enableMonitoring: boolean;
    metrics: Map<string, unknown>;
    renderTimes: unknown[];
    startTime: number;
};

type UiDomainState = {
    activeTab: string;
    isInitialized: boolean;
    theme: string;
    windowSize: {
        height: number;
        width: number;
    };
};

type AppStateShape = {
    charts: ChartDomainState;
    data: DataDomainState;
    errors: ErrorDomainState;
    file: FileDomainState;
    performance: PerformanceDomainState;
    ui: UiDomainState;
};

type DebugInfo = {
    listeners: string[];
    persistentKeys: readonly string[];
    state: unknown;
    validators: string[];
    volatileKeys: readonly string[];
};

type AppStateGlobal = typeof globalThis & {
    __appState?: AppStateManager;
    window?: Window;
};

const PERSISTENT_KEYS = [
    "ui.theme",
    "ui.activeTab",
    "charts.controlsVisible",
    "performance.enableMonitoring",
] as const;

const VOLATILE_KEYS = [
    "data.rawFitData",
    "file.isOpening",
    "performance.metrics",
    "errors.current",
] as const;

/**
 * State change event names emitted by the legacy app-state domain manager.
 */
export const STATE_EVENTS = {
    CHART_CONTROLS_TOGGLED: "chart-controls-toggled",
    CHART_RENDERED: "chart-rendered",
    DATA_CHANGED: "data-changed",
    DATA_CLEARED: "data-cleared",
    DATA_LOADED: "data-loaded",
    ERROR_OCCURRED: "error-occurred",
    FILE_CLOSED: "file-closed",
    FILE_OPENED: "file-opened",
    FILE_OPENING: "file-opening",
    RENDER_COMPLETED: "render-completed",
    RENDER_STARTED: "render-started",
    TAB_CHANGED: "tab-changed",
    THEME_CHANGED: "theme-changed",
    WARNING_OCCURRED: "warning-occurred",
} as const;

const PERSISTENCE_CONFIG = {
    PERSISTENT_KEYS,
    STORAGE_PREFIX: "ffv_state_",
    VOLATILE_KEYS,
} as const;

function createDefaultState(): AppStateShape {
    return {
        charts: {
            controlsVisible: false,
            instances: new Map(),
            isRendered: false,
            lastRenderTime: null,
            visibleFields: new Set(),
        },
        data: {
            isLoaded: false,
            lastModified: null,
            rawFitData: null,
            recordCount: 0,
        },
        errors: {
            current: [],
            history: [],
            lastError: null,
        },
        file: {
            isOpening: false,
            lastOpened: null,
            name: null,
            path: null,
            size: 0,
        },
        performance: {
            enableMonitoring: true,
            metrics: new Map(),
            renderTimes: [],
            startTime: performance.now(),
        },
        ui: {
            activeTab: "summary",
            isInitialized: false,
            theme: "auto",
            windowSize: { height: 0, width: 0 },
        },
    };
}

function getStorage(): Storage | undefined {
    return typeof localStorage === "undefined" ? undefined : localStorage;
}

function getPathSegments(path: string): string[] {
    return path.split(".").filter(Boolean);
}

function isVolatilePath(path: string): boolean {
    return (PERSISTENCE_CONFIG.VOLATILE_KEYS as readonly string[]).includes(
        path
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}

function readProperty(target: unknown, key: string): unknown {
    if (!isRecord(target)) {
        return undefined;
    }

    return target[key];
}

function setProperty(target: unknown, key: string, value: unknown): void {
    if (!isRecord(target)) {
        return;
    }

    target[key] = value;
}

function getRecordCount(data: unknown): number {
    if (!isRecord(data)) {
        return 0;
    }

    const recordMesgs = data["recordMesgs"];
    return Array.isArray(recordMesgs) ? recordMesgs.length : 0;
}

function createErrorEntry(
    error: Error | string,
    context: string
): ErrorStateEntry {
    const entry: ErrorStateEntry = {
        context,
        message: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
    };

    if (error instanceof Error && typeof error.stack === "string") {
        entry.stack = error.stack;
    }

    return entry;
}

/**
 * Central application state with reactive path events and persistence hooks.
 */
class AppStateManager {
    private readonly listeners = new Map<string, Set<StateListener>>();

    private state: AppStateShape = createDefaultState();

    private readonly validators = new Map<string, StateValidator>();

    public constructor() {
        this.setupReactiveProperties();
        this.loadPersistedState();
        this.setupAutoPersistence();

        console.log("[AppState] State manager initialized");
    }

    /** Adds a validator for a state path. */
    public addValidator(path: string, validator: StateValidator): void {
        this.validators.set(path, validator);
    }

    /** Emits an event to all listeners registered for the event name. */
    public emit(event: StateEventName | string, data: unknown): void {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners) {
            return;
        }

        for (const callback of eventListeners) {
            try {
                callback(data);
            } catch (error) {
                console.error(
                    `[AppState] Error in event listener for ${event}:`,
                    error
                );
            }
        }
    }

    /** Emits category-specific events for known state paths. */
    public emitSpecificEvents(
        path: string,
        newValue: unknown,
        oldValue: unknown
    ): void {
        switch (path) {
            case "charts.controlsVisible": {
                this.emit(STATE_EVENTS.CHART_CONTROLS_TOGGLED, {
                    visible: newValue,
                });
                break;
            }

            case "charts.isRendered": {
                if (newValue && !oldValue) {
                    this.emit(STATE_EVENTS.CHART_RENDERED, {
                        renderTime: Date.now(),
                    });
                }
                break;
            }

            case "data.rawFitData": {
                if (newValue && !oldValue) {
                    this.emit(STATE_EVENTS.DATA_LOADED, { data: newValue });
                } else if (!newValue && oldValue) {
                    this.emit(STATE_EVENTS.DATA_CLEARED, {
                        previousData: oldValue,
                    });
                } else if (newValue !== oldValue) {
                    this.emit(STATE_EVENTS.DATA_CHANGED, {
                        data: newValue,
                        previousData: oldValue,
                    });
                }
                break;
            }

            case "file.isOpening": {
                if (newValue) {
                    this.emit(STATE_EVENTS.FILE_OPENING, {});
                }
                break;
            }

            case "ui.activeTab": {
                this.emit(STATE_EVENTS.TAB_CHANGED, {
                    previousTab: oldValue,
                    tab: newValue,
                });
                break;
            }

            case "ui.theme": {
                this.emit(STATE_EVENTS.THEME_CHANGED, {
                    previousTheme: oldValue,
                    theme: newValue,
                });
                break;
            }
        }
    }

    /** Gets a state value by dot-notation path. */
    public get(path: string): unknown {
        if (!path) {
            return this.state;
        }

        let current: unknown = this.state;
        for (const key of getPathSegments(path)) {
            current = readProperty(current, key);
            if (current === undefined) {
                return undefined;
            }
        }

        return current;
    }

    /** Gets debug information about the current state manager. */
    public getDebugInfo(): DebugInfo {
        return {
            listeners: [...this.listeners.keys()],
            persistentKeys: PERSISTENCE_CONFIG.PERSISTENT_KEYS,
            state: this.getSnapshot(),
            validators: [...this.validators.keys()],
            volatileKeys: PERSISTENCE_CONFIG.VOLATILE_KEYS,
        };
    }

    /** Gets a JSON-compatible snapshot of the current state. */
    public getSnapshot(): unknown {
        return JSON.parse(JSON.stringify(this.state));
    }

    /** Loads persisted state paths from localStorage when available. */
    public loadPersistedState(): void {
        const storage = getStorage();
        if (!storage) {
            return;
        }

        try {
            for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
                const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path;
                const stored = storage.getItem(key);

                if (stored !== null) {
                    try {
                        const value: unknown = JSON.parse(stored);
                        this.set(path, value);
                        console.log(
                            `[AppState] Loaded persisted state for ${path}:`,
                            value
                        );
                    } catch (parseError) {
                        console.warn(
                            `[AppState] Failed to parse persisted state for ${path}:`,
                            parseError
                        );
                    }
                }
            }
        } catch (error) {
            console.error("[AppState] Error loading persisted state:", error);
        }
    }

    /** Removes an event listener. */
    public off(event: string, callback: StateListener): void {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners) {
            return;
        }

        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
            this.listeners.delete(event);
        }
    }

    /** Adds an event listener and returns a cleanup function. */
    public on(event: string, callback: StateListener): Unsubscribe {
        const eventListeners =
            this.listeners.get(event) ?? new Set<StateListener>();
        eventListeners.add(callback);
        this.listeners.set(event, eventListeners);

        return () => {
            this.off(event, callback);
        };
    }

    /** Persists a state path to localStorage when it is not volatile. */
    public persistState(path: string): void {
        if (isVolatilePath(path)) {
            return;
        }

        const storage = getStorage();
        if (!storage) {
            return;
        }

        try {
            const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path;
            const value = this.get(path);

            if (value !== undefined) {
                storage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error(
                `[AppState] Error persisting state for ${path}:`,
                error
            );
        }
    }

    /** Clears persisted state and resets runtime state to defaults. */
    public reset(): void {
        const storage = getStorage();
        if (storage) {
            for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
                const key = PERSISTENCE_CONFIG.STORAGE_PREFIX + path;
                storage.removeItem(key);
            }
        }

        this.state = createDefaultState();
        this.setupReactiveProperties();

        this.emit("state-reset", {});
        console.log("[AppState] State reset to defaults");
    }

    /** Sets a state value by dot-notation path. */
    public set(path: string, value: unknown): boolean {
        try {
            const keys = getPathSegments(path);
            let current: unknown = this.state;

            for (const key of keys.slice(0, -1)) {
                if (!isRecord(current)) {
                    return false;
                }

                if (!isRecord(current[key])) {
                    current[key] = {};
                }

                current = current[key];
            }

            const finalKey = keys.at(-1);
            if (finalKey) {
                setProperty(current, finalKey, value);
            }

            return true;
        } catch (error) {
            console.error(`[AppState] Error setting ${path}:`, error);
            return false;
        }
    }

    /** Sets up automatic persistence for persistent paths. */
    public setupAutoPersistence(): void {
        for (const path of PERSISTENCE_CONFIG.PERSISTENT_KEYS) {
            this.on(`${path}-changed`, () => {
                this.persistState(path);
            });
        }
    }

    /** Defines reactive properties for selected state paths. */
    public setupReactiveProperties(): void {
        const reactivePaths = [
            "data.rawFitData",
            "data.isLoaded",
            "file.isOpening",
            "ui.activeTab",
            "ui.theme",
            "charts.controlsVisible",
            "charts.isRendered",
        ];

        for (const path of reactivePaths) {
            this.createReactiveProperty(this.state, path, this.get(path));
        }
    }

    /** Updates multiple state paths and emits a batch event. */
    public update(updates: Record<string, unknown>): void {
        const oldState = this.getSnapshot();

        try {
            for (const [path, value] of Object.entries(updates)) {
                this.set(path, value);
            }

            this.emit("state-batch-updated", {
                newState: this.getSnapshot(),
                oldState,
                updates,
            });
        } catch (error) {
            console.error("[AppState] Error in batch update:", error);
        }
    }

    private createReactiveProperty(
        obj: unknown,
        path: string,
        initialValue: unknown
    ): void {
        const keys = getPathSegments(path);
        let current = obj;

        for (const key of keys.slice(0, -1)) {
            if (!isRecord(current)) {
                return;
            }

            if (!isRecord(current[key])) {
                current[key] = {};
            }

            current = current[key];
        }

        const finalKey = keys.at(-1);
        if (!finalKey || !isRecord(current)) {
            return;
        }

        const descriptor = Object.getOwnPropertyDescriptor(current, finalKey);
        if (descriptor?.get && descriptor.set) {
            return;
        }

        let value = initialValue;

        Object.defineProperty(current, finalKey, {
            configurable: true,
            enumerable: true,
            get() {
                return value;
            },
            set: (newValue: unknown) => {
                const oldValue = value;
                const validator = this.validators.get(path);
                if (validator && !validator(newValue, oldValue)) {
                    console.warn(
                        `[AppState] Validation failed for ${path}:`,
                        newValue
                    );
                    return;
                }

                value = newValue;

                this.emit(`${path}-changed`, {
                    newValue,
                    oldValue,
                    path,
                    timestamp: Date.now(),
                });
                this.emitSpecificEvents(path, newValue, oldValue);
            },
        });
    }
}

const appState = new AppStateManager();
const stateGlobal = globalThis as AppStateGlobal;

if (stateGlobal.window !== undefined) {
    stateGlobal.__appState = appState;

    console.log("[AppState] Global app state handle configured");
}

/** Adds an error entry to app state and error history. */
export function addError(error: Error | string, context = ""): void {
    const currentErrors = appState.get("errors.current");
    const errorHistory = appState.get("errors.history");
    const errorObj = createErrorEntry(error, context);

    appState.update({
        "errors.current": [
            ...(Array.isArray(currentErrors) ? currentErrors : []),
            errorObj,
        ],
        "errors.history": [
            ...(Array.isArray(errorHistory) ? errorHistory : []),
            errorObj,
        ].slice(-100),
        "errors.lastError": errorObj,
    });

    appState.emit(STATE_EVENTS.ERROR_OCCURRED, errorObj);
}

/** Clears current error entries. */
export function clearErrors(): void {
    appState.set("errors.current", []);
}

/** Clears loaded FIT data from app state. */
export function clearRawFitData(): void {
    appState.update({
        "data.isLoaded": false,
        "data.lastModified": null,
        "data.rawFitData": null,
        "data.recordCount": 0,
    });
}

/** Gets a state value by dot-notation path. */
export function getState(path: string): unknown {
    return appState.get(path);
}

/** Sets the active tab identifier. */
export function setActiveTab(tabId: string): void {
    appState.set("ui.activeTab", tabId);
}

/** Sets chart controls visibility. */
export function setChartControlsVisible(visible: boolean): void {
    appState.set("charts.controlsVisible", visible);
}

/** Sets file-opening state and current file path. */
export function setFileOpeningState(
    isOpening: boolean,
    filePath: string | null = null
): void {
    appState.update({
        "file.isOpening": isOpening,
        "file.lastOpened": isOpening ? null : Date.now(),
        "file.path": filePath,
    });
}

/** Sets loaded FIT data and derived file metrics. */
export function setRawFitData(data: unknown): void {
    appState.update({
        "data.isLoaded": Boolean(data),
        "data.lastModified": Date.now(),
        "data.rawFitData": data,
        "data.recordCount": getRecordCount(data),
    });
}

/** Sets a state value by dot-notation path. */
export function setState(path: string, value: unknown): boolean {
    return appState.set(path, value);
}

/** Sets the app theme. */
export function setTheme(theme: string): void {
    appState.set("ui.theme", theme);
}

/** Subscribes to an event or path change event. */
export function subscribe(event: string, callback: StateListener): Unsubscribe {
    return appState.on(event, callback);
}

export { appState };
export default appState;
