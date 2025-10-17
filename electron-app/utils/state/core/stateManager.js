/**
 * @fileoverview Path-based state manager built on top of a vanilla zustand store.
 * @description Provides immutable updates, history tracking, and subscription helpers while
 * avoiding direct window/global mutations. This module intentionally exposes only state APIs.
 */

import { appStateStore, createInitialAppState } from "./appStateStore.js";

/**
 * @typedef {import("./appStateStore.js").AppStateShape} AppStateShape
 */

/**
 * @typedef {Object} StateUpdateOptions
 * @property {boolean} [silent=false] When true, listeners are not notified.
 * @property {string} [source="unknown"] Tag describing the source of the update.
 * @property {boolean} [merge=false] When true, plain objects are shallow merged.
 */

const MAX_HISTORY_SIZE = 50;
/** @type {Array<{path: string, newValue: unknown, oldValue: unknown, source: string, timestamp: number}>} */
const stateHistory = [];
/** @type {Map<string, Set<Function>>} */
const stateListeners = new Map();
const stateManagerInitState = { initialized: false };

function __clearAllListenersForTests() {
    stateListeners.clear();
}

function __resetStateManagerForTests() {
    __clearAllListenersForTests();
    clearStateHistory();
    stateManagerInitState.initialized = false;
    resetState();
}

function clearStateHistory() {
    stateHistory.length = 0;
    console.log("[StateManager] State history cleared");
}

function createReactiveProperty(propertyName, statePath) {
    console.warn(
        `[StateManager] createReactiveProperty(${propertyName}, ${statePath}) is deprecated. Use state selectors instead.`
    );
}

function getNestedValue(state, path) {
    if (!path) {
        return state;
    }
    const segments = path.split(".");
    /** @type {any} */ let cursor = state;
    for (const key of segments) {
        if (cursor == null || (typeof cursor !== "object" && !Array.isArray(cursor))) {
            return;
        }
        if (!Object.hasOwn(cursor, key)) {
            return;
        }
        cursor = cursor[key];
    }
    return cursor;
}

function getState(path) {
    const state = appStateStore.getState();
    return typeof path === "string" && path.length > 0 ? getNestedValue(state, path) : state;
}

function getStateHistory() {
    return Array.from(stateHistory);
}

function getSubscriptions() {
    const subscriptionDetails = {};
    let totalListeners = 0;
    for (const [path, listeners] of stateListeners.entries()) {
        const listenerCount = listeners.size;
        totalListeners += listenerCount;
        subscriptionDetails[path] = {
            hasListeners: listenerCount > 0,
            listenerCount,
        };
    }
    return {
        paths: Array.from(stateListeners.keys()),
        subscriptionDetails,
        totalListeners,
    };
}

function initializeStateManager() {
    if (stateManagerInitState.initialized) {
        console.log("[StateManager] initializeStateManager called more than once; ignoring");
        return;
    }
    loadPersistedState();
    subscribe("ui", () => persistState(["ui"]));
    subscribe("charts.controlsVisible", () => persistState(["charts.controlsVisible"]));
    subscribe("map.baseLayer", () => persistState(["map.baseLayer"]));
    stateManagerInitState.initialized = true;
    console.log("[StateManager] Initialized (zustand-backed)");
}

function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function loadPersistedState(paths = ["ui", "charts.controlsVisible", "map.baseLayer"]) {
    try {
        if (typeof localStorage === "undefined") {
            return;
        }
        const raw = localStorage.getItem("fitFileViewer_state");
        if (!raw) {
            return;
        }
        const parsed = JSON.parse(raw);
        for (const path of paths) {
            const value = getNestedValue(parsed, path);
            if (value !== undefined) {
                setState(path, value, { silent: true, source: "localStorage" });
            }
        }
    } catch (error) {
        console.error("[StateManager] Failed to load persisted state:", error);
    }
}

function notifyAllSubscribers(previousState, nextState) {
    for (const [path] of stateListeners.entries()) {
        const oldValue = getNestedValue(previousState, path);
        const newValue = getNestedValue(nextState, path);
        if (Object.is(oldValue, newValue)) {
            continue;
        }
        notifyListeners(path, newValue, oldValue, nextState);
    }
}

function notifyListeners(path, newValue, oldValue, latestState) {
    const exactListeners = stateListeners.get(path);
    if (exactListeners) {
        for (const listener of exactListeners) {
            try {
                listener(newValue, oldValue, path);
            } catch (error) {
                console.error(`[StateManager] Listener error for ${path}:`, error);
            }
        }
    }

    const segments = path.split(".");
    for (let index = segments.length - 1; index > 0; index--) {
        const parentPath = segments.slice(0, index).join(".");
        const parentListeners = stateListeners.get(parentPath);
        if (!parentListeners || parentListeners.size === 0) {
            continue;
        }
        const parentValue = getNestedValue(latestState, parentPath);
        for (const listener of parentListeners) {
            try {
                listener(parentValue, parentValue, parentPath);
            } catch (error) {
                console.error(`[StateManager] Parent listener error for ${parentPath}:`, error);
            }
        }
    }
}

function persistState(paths = ["ui", "charts.controlsVisible", "map.baseLayer"]) {
    try {
        if (typeof localStorage === "undefined") {
            return;
        }
        let snapshot = {};
        for (const path of paths) {
            const value = getState(path);
            if (value !== undefined) {
                snapshot = setNestedValueImmutable(snapshot, path, value, false);
            }
        }
        localStorage.setItem("fitFileViewer_state", JSON.stringify(snapshot));
    } catch (error) {
        console.error("[StateManager] Failed to persist state:", error);
    }
}

function recordStateHistory(path, newValue, oldValue, source) {
    if (stateHistory.length >= MAX_HISTORY_SIZE) {
        stateHistory.shift();
    }
    stateHistory.push({ newValue, oldValue, path, source, timestamp: Date.now() });
}

function resetState(path) {
    if (typeof path === "string" && path.length > 0) {
        const initialSnapshot = createInitialAppState();
        const initialValue = getNestedValue(initialSnapshot, path);
        setState(path, initialValue, { source: "stateManager.resetState" });
        return;
    }
    const previousState = appStateStore.getState();
    const nextState = createInitialAppState();
    appStateStore.setState(nextState, true, "stateManager.resetState");
    clearStateHistory();
    notifyAllSubscribers(previousState, nextState);
    console.log("[StateManager] State reset: all");
}

function setNestedValueImmutable(prevState, path, value, merge) {
    const segments = path.split(".");
    if (segments.length === 0) {
        return prevState;
    }

    const nextState = { ...prevState };
    /** @type {any} */ let nextCursor = nextState;
    /** @type {any} */ let prevCursor = prevState;

    for (let index = 0; index < segments.length - 1; index++) {
        const key = segments[index];
        if (!key) {
            continue;
        }

        const prevChild = isPlainObject(prevCursor) || Array.isArray(prevCursor) ? prevCursor[key] : undefined;
        const clonedChild = isPlainObject(prevChild)
            ? { ...prevChild }
            : Array.isArray(prevChild)
                ? Array.from(prevChild)
                : {};

        if (!isPlainObject(nextCursor) && !Array.isArray(nextCursor)) {
            break;
        }

        nextCursor[key] = clonedChild;
        nextCursor = clonedChild;
        prevCursor = isPlainObject(prevChild) || Array.isArray(prevChild) ? prevChild : {};
    }

    const finalKey = segments.at(-1);
    if (!finalKey || (!isPlainObject(nextCursor) && !Array.isArray(nextCursor))) {
        console.warn(
            `[StateManager] Unable to set value for path "${path}". Final key is invalid or parent is not mutable.`
        );
        return prevState;
    }

    const previousValue = isPlainObject(prevCursor) || Array.isArray(prevCursor) ? prevCursor[finalKey] : undefined;

    if (merge && isPlainObject(previousValue) && isPlainObject(value)) {
        nextCursor[finalKey] = { ...previousValue, ...value };
    } else {
        nextCursor[finalKey] = value;
    }

    return nextState;
}

function setState(path, value, options = {}) {
    if (typeof path !== "string" || path.length === 0) {
        console.warn("[StateManager] setState requires a non-empty path");
        return;
    }

    const { merge = false, silent = false, source = "unknown" } = options;
    const previousState = appStateStore.getState();
    const oldValue = getNestedValue(previousState, path);
    const nextState = setNestedValueImmutable(previousState, path, value, merge);
    const newValue = getNestedValue(nextState, path);

    if (Object.is(oldValue, newValue)) {
        if (source.includes("dev") || source.includes("debug")) {
            console.log(`[StateManager] ${path} unchanged by ${source}`);
        }
        return;
    }

    recordStateHistory(path, newValue, oldValue, source);
    appStateStore.setState(nextState, true, `stateManager.setState:${source}`);

    if (!silent) {
        notifyListeners(path, newValue, oldValue, nextState);
    }

    console.log(`[StateManager] ${path} updated by ${source}:`, { newValue, oldValue });
}

function subscribe(path, callback) {
    if (!stateListeners.has(path)) {
        stateListeners.set(path, new Set());
    }
    const listeners = stateListeners.get(path);
    listeners.add(callback);
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

function updateState(path, updates, options = {}) {
    setState(path, updates, { ...options, merge: true });
}

const __debugState = new Proxy(
    {},
    {
        get(_target, key) {
            const state = appStateStore.getState();
            return Reflect.get(state, key);
        },
        ownKeys() {
            return Reflect.ownKeys(appStateStore.getState());
        },
        getOwnPropertyDescriptor(_target, key) {
            const state = appStateStore.getState();
            if (!Object.hasOwn(state, key)) {
                return;
            }
            return {
                configurable: true,
                enumerable: true,
                value: Reflect.get(state, key),
                writable: false,
            };
        },
    }
);

export { __clearAllListenersForTests };
export { __debugState };
export { __resetStateManagerForTests };
export { clearStateHistory };
export { createReactiveProperty };
export { getState };
export { getStateHistory };
export { getSubscriptions };
export { initializeStateManager };
export { loadPersistedState };
export { persistState };
export { resetState };
export { setState };
export { subscribe };
export { updateState };

try {
    const g = /** @type {any} */ (typeof globalThis === "object" ? globalThis : undefined);
    if (g && typeof g === "object") {
        const api = {
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
            updateState,
        };
        if (!g.__STATE_MANAGER_API__ || typeof g.__STATE_MANAGER_API__ !== "object") {
            Object.defineProperty(g, "__STATE_MANAGER_API__", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: api,
            });
        } else {
            Object.assign(g.__STATE_MANAGER_API__, api);
        }
    }
} catch (error) {
    console.warn("[StateManager] Failed to expose global API:", error);
}
