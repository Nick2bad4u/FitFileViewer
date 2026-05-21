import { AppState, type AppStateShape } from "./stateManagerDefaults.js";
import {
    clearStateHistory as clearStateHistoryImpl,
    getStateHistory as getStateHistoryImpl,
    type StateHistoryEntry,
    stateHistory,
} from "./stateManagerHistory.js";
import { getNestedValue, setNestedValue } from "./stateManagerPathUtils.js";
import { resetState as resetStateImpl } from "./stateManagerReset.js";

/** Listener invoked when a subscribed state path changes. */
export type StateListener = (
    newValue: unknown,
    oldValue: unknown,
    path: string
) => void;

type Unsubscribe = () => void;

/**
 * Options used when mutating state.
 */
export type StateUpdateOptions = {
    readonly merge?: boolean;
    readonly silent?: boolean;
    readonly source?: string;
};

/**
 * Subscription information returned for debugging.
 */
export type SubscriptionInfo = {
    readonly paths: string[];
    readonly subscriptionDetails: Record<
        string,
        {
            readonly hasListeners: boolean;
            readonly listenerCount: number;
        }
    >;
    totalListeners: number;
};

type StateManagerInitState = {
    initialized: boolean;
};

type StateManagerGlobal = typeof globalThis & {
    __ffvSingletonStateSubscriptions?: Record<string, Unsubscribe>;
    __STATE_MANAGER_API__?: StateManagerApi;
};

type StateManagerApi = {
    readonly __clearAllListenersForTests: () => void;
    readonly __debugState: AppStateShape;
    readonly __resetStateManagerForTests: () => void;
    readonly clearStateHistory: typeof clearStateHistory;
    readonly createReactiveProperty: typeof createReactiveProperty;
    readonly getState: typeof getState;
    readonly getStateHistory: typeof getStateHistory;
    readonly getSubscriptions: typeof getSubscriptions;
    readonly initializeStateManager: typeof initializeStateManager;
    readonly loadPersistedState: typeof loadPersistedState;
    readonly persistState: typeof persistState;
    readonly resetState: typeof resetState;
    readonly setState: typeof setState;
    readonly subscribe: typeof subscribe;
    readonly subscribeSingleton: typeof subscribeSingleton;
    readonly updateState: typeof updateState;
};

const MAX_HISTORY_SIZE = 50;
const DEFAULT_PERSISTED_PATHS = [
    "ui",
    "charts.controlsVisible",
    "map.baseLayer",
    "browser.view",
] as const;

const stateListeners = new Map<string, Set<StateListener>>();
const stateManagerInitState: StateManagerInitState = { initialized: false };

/**
 * Clears all registered state listeners for test isolation.
 */
export function __clearAllListenersForTests(): void {
    try {
        stateListeners.clear();
        console.log("[StateManager] All listeners cleared (tests)");
    } catch (error) {
        console.warn("[StateManager] Failed to clear listeners:", error);
    }
}

/**
 * Fully resets the state manager for test isolation.
 */
export function __resetStateManagerForTests(): void {
    try {
        __clearAllListenersForTests();
    } catch {
        // Ignore test cleanup errors.
    }

    try {
        clearStateHistory();
    } catch {
        // Ignore test cleanup errors.
    }

    try {
        resetState();
    } catch {
        // Ignore test cleanup errors.
    }

    stateManagerInitState.initialized = false;
}

/**
 * Creates a reactive global property that maps reads and writes to a state
 * path.
 *
 * @param propertyName - Global property name.
 * @param statePath - State path to bind to the property.
 */
export function createReactiveProperty(
    propertyName: string,
    statePath: string
): void {
    try {
        const descriptor = Object.getOwnPropertyDescriptor(
            globalThis,
            propertyName
        );

        if (descriptor) {
            if (descriptor.get && descriptor.set) {
                console.log(
                    `[StateManager] Property ${propertyName} is already reactive`
                );
                return;
            }

            const currentValue = readGlobalProperty(propertyName);
            if (currentValue !== undefined && currentValue !== null) {
                setState(statePath, currentValue, {
                    source: `createReactiveProperty.${propertyName}`,
                });
            }
        }

        Object.defineProperty(globalThis, propertyName, {
            configurable: true,
            get() {
                return getState(statePath);
            },
            set(value: unknown) {
                setState(statePath, value, {
                    source: `window.${propertyName}`,
                });
            },
        });

        console.log(
            `[StateManager] Created reactive property: ${propertyName} -> ${statePath}`
        );
    } catch (error) {
        console.warn(
            `[StateManager] Failed to create reactive property ${propertyName}:`,
            error
        );
        if (getState(statePath) === undefined) {
            setState(statePath, null, {
                source: `createReactiveProperty.fallback.${propertyName}`,
            });
        }
    }
}

/**
 * Gets state by dot-notation path.
 *
 * @param path - Dot-notation path to a state property.
 *
 * @returns State value at the path, or the root state for an empty path.
 */
export function getState<T = unknown>(
    path = ""
): T | AppStateShape | undefined {
    if (!path) {
        return AppState;
    }

    const keys = path.split(".");
    let value: unknown = AppState;

    for (const key of keys) {
        if (value === null || typeof value !== "object") {
            return undefined;
        }

        const container = value as Record<string, unknown>;
        if (!Object.hasOwn(container, key)) {
            return undefined;
        }

        value = container[key];
    }

    return value as T;
}

/**
 * Gets subscription information for debugging.
 *
 * @returns Current subscription metadata.
 */
export function getSubscriptions(): SubscriptionInfo {
    const subscriptionInfo: SubscriptionInfo = {
        paths: Array.from(stateListeners.keys()),
        subscriptionDetails: {},
        totalListeners: 0,
    };

    for (const [path, listeners] of stateListeners.entries()) {
        const listenerCount = listeners.size;
        subscriptionInfo.totalListeners += listenerCount;
        subscriptionInfo.subscriptionDetails[path] = {
            hasListeners: listenerCount > 0,
            listenerCount,
        };
    }

    return subscriptionInfo;
}

/**
 * Initializes the state manager with reactive compatibility properties and
 * persisted state.
 */
export function initializeStateManager(): void {
    if (stateManagerInitState.initialized) {
        console.log(
            "[StateManager] initializeStateManager invoked multiple times; ignoring subsequent calls"
        );
        return;
    }

    createReactiveProperty("globalData", "globalData");
    createReactiveProperty("isChartRendered", "charts.isRendered");

    loadPersistedState();

    subscribe("ui", () => persistState(["ui"]));
    subscribe("charts.controlsVisible", () =>
        persistState(["charts.controlsVisible"])
    );
    subscribe("map.baseLayer", () => persistState(["map.baseLayer"]));
    subscribe("browser.view", () => persistState(["browser.view"]));

    stateManagerInitState.initialized = true;

    console.log(
        "[StateManager] Initialized with reactive properties and persistence"
    );
}

/**
 * Loads selected persisted state branches from localStorage.
 *
 * @param paths - State paths to load.
 */
export function loadPersistedState(
    paths: readonly string[] = DEFAULT_PERSISTED_PATHS
): void {
    try {
        const savedState = localStorage.getItem("fitFileViewer_state");
        if (savedState === null || savedState === "") {
            return;
        }

        const parsedState = JSON.parse(savedState) as unknown;

        for (const path of paths) {
            const value = getNestedValue(parsedState, path);
            if (value !== undefined) {
                setState(path, value, { silent: true, source: "localStorage" });
            }
        }

        console.log("[StateManager] State loaded from localStorage");
    } catch (error) {
        console.error("[StateManager] Failed to load persisted state:", error);
    }
}

/**
 * Persists selected state paths to localStorage.
 *
 * @param paths - State paths to persist.
 */
export function persistState(
    paths: readonly string[] = DEFAULT_PERSISTED_PATHS
): void {
    let stateToSave: Record<string, unknown> = {};

    try {
        const existingRaw = localStorage.getItem("fitFileViewer_state");
        if (existingRaw !== null && existingRaw !== "") {
            const parsed = JSON.parse(existingRaw) as unknown;
            if (
                parsed !== null &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                stateToSave = parsed as Record<string, unknown>;
            }
        }
    } catch {
        stateToSave = {};
    }

    for (const path of paths) {
        const value = getState(path);
        if (value !== undefined) {
            setNestedValue(stateToSave, path, value);
        }
    }

    try {
        localStorage.setItem(
            "fitFileViewer_state",
            JSON.stringify(stateToSave)
        );
        console.log("[StateManager] State persisted to localStorage");
    } catch (error) {
        console.error("[StateManager] Failed to persist state:", error);
    }
}

/**
 * Sets a state value by dot-notation path and notifies subscribers.
 *
 * @param path - Dot-notation path to a state property.
 * @param value - New value to set.
 * @param options - Optional update behavior.
 */
export function setState(
    path: string,
    value: unknown,
    options: StateUpdateOptions = {}
): void {
    const keys = path.split(".");
    const oldValue = getState(path);
    const { merge = false, silent = false, source = "unknown" } = options;
    let target: unknown = AppState;

    for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (key) {
            if (target === null || typeof target !== "object") {
                console.warn("[StateManager] Invalid target for path", path);
                return;
            }

            const container = target as Record<string, unknown>;
            const nextValue = container[key];
            if (
                nextValue === null ||
                typeof nextValue !== "object" ||
                Array.isArray(nextValue)
            ) {
                container[key] = {};
            }

            target = container[key];
        }
    }

    const finalKey = keys.at(-1);
    if (typeof finalKey !== "string" || !finalKey) {
        console.warn("[StateManager] Invalid final key for path", path);
        return;
    }

    if (target === null || typeof target !== "object") {
        console.warn("[StateManager] Invalid target for path", path);
        return;
    }

    const container = target as Record<string, unknown>;
    if (shouldMergeStateValue(merge, oldValue, value)) {
        container[finalKey] = {
            ...(oldValue as Record<string, unknown>),
            ...(value as Record<string, unknown>),
        };
    } else {
        container[finalKey] = value;
    }

    const hasChanged = !Object.is(oldValue, value);
    if (hasChanged) {
        if (stateHistory.length >= MAX_HISTORY_SIZE) {
            stateHistory.shift();
        }

        stateHistory.push({
            newValue: value,
            oldValue,
            path,
            source,
            timestamp: Date.now(),
        });
    }

    if (!silent && hasChanged) {
        notifyListeners(path, value, oldValue);
    }

    if (hasChanged || source.includes("dev") || source.includes("debug")) {
        console.log(`[StateManager] ${path} updated by ${source}:`, {
            newValue: value,
            oldValue,
        });
    }
}

/**
 * Subscribes to state changes for a specific path.
 *
 * @param path - Dot-notation state path.
 * @param callback - Listener called when the path changes.
 *
 * @returns Unsubscribe function.
 */
export function subscribe(path: string, callback: StateListener): Unsubscribe {
    if (!stateListeners.has(path)) {
        stateListeners.set(path, new Set<StateListener>());
    }

    const listeners = stateListeners.get(path);
    listeners?.add(callback);

    return () => {
        const current = stateListeners.get(path);
        if (!current) {
            return;
        }

        current.delete(callback);
        if (current.size === 0) {
            stateListeners.delete(path);
        }
    };
}

/**
 * Subscribes to state changes using a singleton id to avoid duplicate active
 * subscriptions.
 *
 * @param path - Dot-notation state path.
 * @param id - Unique subscription id.
 * @param callback - Listener called when the path changes.
 *
 * @returns Unsubscribe function.
 */
export function subscribeSingleton(
    path: string,
    id: string,
    callback: StateListener
): Unsubscribe {
    const globalState = globalThis as StateManagerGlobal;
    if (
        globalState.__ffvSingletonStateSubscriptions === undefined ||
        globalState.__ffvSingletonStateSubscriptions === null
    ) {
        globalState.__ffvSingletonStateSubscriptions = Object.create(
            null
        ) as Record<string, Unsubscribe>;
    }

    const registry = globalState.__ffvSingletonStateSubscriptions;
    const key = id.trim();

    if (!key) {
        return subscribe(path, callback);
    }

    try {
        const existingUnsubscribe = registry[key];
        if (typeof existingUnsubscribe === "function") {
            existingUnsubscribe();
        }
    } catch {
        // Ignore cleanup errors from previous subscriptions.
    }

    const unsubscribe = subscribe(path, callback);
    registry[key] = unsubscribe;

    return () => {
        try {
            if (registry[key] === unsubscribe) {
                delete registry[key];
            }
        } catch {
            // Ignore registry cleanup errors.
        }

        unsubscribe();
    };
}

/**
 * Updates state by merging an object into an existing object value.
 *
 * @param path - Dot-notation path to a state property.
 * @param updates - Object updates to merge.
 * @param options - Optional update behavior.
 */
export function updateState(
    path: string,
    updates: Record<string, unknown>,
    options: StateUpdateOptions = {}
): void {
    setState(path, updates, { ...options, merge: true });
}

/**
 * Debug reference to the root state object.
 */
export const __debugState = AppState;

/**
 * Clears state history through the state manager facade.
 */
export function clearStateHistory(): void {
    clearStateHistoryImpl();
}

/**
 * Gets state history through the state manager facade.
 *
 * @returns Array of tracked state changes.
 */
export function getStateHistory(): StateHistoryEntry[] {
    return getStateHistoryImpl();
}

/**
 * Resets state through the state manager facade.
 *
 * @param path - Optional state path to reset.
 */
export function resetState(path?: string): void {
    resetStateImpl(path);
}

function notifyListeners(
    path: string,
    newValue: unknown,
    oldValue: unknown
): void {
    const exactListeners = stateListeners.get(path);
    if (exactListeners) {
        for (const callback of exactListeners) {
            try {
                callback(newValue, oldValue, path);
            } catch (error) {
                console.error(
                    `[StateManager] Error in listener for ${path}:`,
                    error
                );
            }
        }
    }

    const pathParts = path.split(".");
    for (let i = pathParts.length - 1; i > 0; i -= 1) {
        const parentPath = pathParts.slice(0, i).join(".");
        const parentListeners = stateListeners.get(parentPath);

        if (parentListeners) {
            const parentValue = getState(parentPath);
            for (const callback of parentListeners) {
                try {
                    callback(parentValue, parentValue, parentPath);
                } catch (error) {
                    console.error(
                        `[StateManager] Error in parent listener for ${parentPath}:`,
                        error
                    );
                }
            }
        }
    }
}

function readGlobalProperty(propertyName: string): unknown {
    const globalRecord = globalThis as Record<string, unknown>;
    return globalRecord[propertyName];
}

function shouldMergeStateValue(
    merge: boolean,
    oldValue: unknown,
    value: unknown
): boolean {
    return (
        merge &&
        oldValue !== null &&
        value !== null &&
        typeof oldValue === "object" &&
        typeof value === "object" &&
        !Array.isArray(oldValue) &&
        !Array.isArray(value)
    );
}

try {
    const globalState = globalThis as StateManagerGlobal;
    const api: StateManagerApi = {
        __clearAllListenersForTests,
        __debugState,
        __resetStateManagerForTests,
        clearStateHistory,
        createReactiveProperty,
        getState,
        getStateHistory,
        getSubscriptions,
        initializeStateManager,
        loadPersistedState,
        persistState,
        resetState,
        setState,
        subscribe,
        subscribeSingleton,
        updateState,
    };

    if (
        globalState.__STATE_MANAGER_API__ === undefined ||
        globalState.__STATE_MANAGER_API__ === null
    ) {
        Object.defineProperty(globalState, "__STATE_MANAGER_API__", {
            configurable: true,
            enumerable: false,
            value: api,
            writable: true,
        });
    } else {
        Object.assign(globalState.__STATE_MANAGER_API__, api);
    }
} catch {
    // Ignore global exposure errors.
}
