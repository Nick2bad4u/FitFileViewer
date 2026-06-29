import type { AppStateShape } from "./stateManagerDefaults.js";
import {
    clearStateHistory as clearStateHistoryImpl,
    getStateHistory as getStateHistoryImpl,
    type StateHistoryEntry,
    stateHistory,
} from "./stateManagerHistory.js";
import { getNestedValue, setNestedValue } from "./stateManagerPathUtils.js";
import { resetState as resetStateImpl } from "./stateManagerReset.js";
import {
    getStateManagerRuntime,
    type StateManagerRuntime,
} from "./stateManagerRuntime.js";
import { getRootState } from "./stateManagerStore.js";
import {
    getStateStorageRuntime,
    type StateStorageRuntime,
} from "./stateStorageRuntime.js";
import {
    normalizeBrowserListingState,
    normalizeBrowserScanState,
    normalizeBrowserStateBranch,
    normalizeBrowserView,
} from "../domain/browserStateContract.js";
import {
    normalizeFitFileLoadingPhase,
    normalizeFitFileLoadingProgress,
    normalizeFitFileLoadingState,
    normalizeFitFileStateBranch,
} from "../domain/fitFileLoadingContract.js";
import {
    normalizeMapBaseLayer,
    normalizeMapStateBranch,
} from "../domain/mapBaseLayerContract.js";
import { normalizeRendererActiveTab } from "../domain/rendererActiveTabContract.js";
import {
    normalizeRendererActiveFileFitFileBranch,
    normalizeRendererActiveFileUiBranch,
    normalizeRendererCurrentFile,
    normalizeRendererFileInfo,
    normalizeRendererUnloadButtonVisible,
} from "../domain/rendererActiveFileContract.js";
import {
    normalizeRendererNotification,
    normalizeRendererNotificationUiBranch,
} from "../domain/rendererNotificationContract.js";
import {
    normalizeRendererLayoutUiBranch,
    normalizeRendererSidebarCollapsed,
} from "../domain/rendererLayoutContract.js";
import {
    normalizeDragCounter,
    normalizeDropOverlayVisible,
    normalizeRendererDragDropUiBranch,
} from "../domain/rendererDragDropContract.js";
import {
    normalizeRendererExporting,
    normalizeRendererExportUiBranch,
} from "../domain/rendererExportContract.js";
import {
    normalizeRendererLoading,
    normalizeRendererLoadingIndicator,
    normalizeRendererLoadingUiBranch,
} from "../domain/rendererLoadingContract.js";
import {
    normalizeRendererChartRenderStateBranch,
    normalizeRendererMapRenderStateBranch,
    normalizeRendererRenderFlag,
    normalizeRendererTableRenderStateBranch,
} from "../domain/rendererRenderStateContract.js";
import {
    normalizeRendererTheme,
    normalizeRendererThemeUiBranch,
} from "../domain/rendererThemeContract.js";

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

const MAX_HISTORY_SIZE = 50;
const DEFAULT_PERSISTED_PATHS = [
    "ui",
    "charts.controlsVisible",
    "map.baseLayer",
    "browser.view",
] as const;
const RENDERER_ACTIVE_TAB_STATE_PATHS = new Set([
    "ui.activeTab",
    "ui.activeTabContent",
]);
const RENDERER_ACTIVE_TAB_UI_KEYS = ["activeTab", "activeTabContent"] as const;
const ROOT_STATE_PATH_NORMALIZERS = new Map<
    string,
    (value: unknown) => unknown
>([["isLoading", normalizeRendererLoading]]);
const UI_STATE_PATH_NORMALIZERS = new Map<string, (value: unknown) => unknown>([
    ["ui.currentNotification", normalizeRendererNotification],
    ["ui.dragCounter", normalizeDragCounter],
    ["ui.dropOverlay.visible", normalizeDropOverlayVisible],
    ["ui.fileInfo", normalizeRendererFileInfo],
    ["ui.isExporting", normalizeRendererExporting],
    ["ui.lastNotification", normalizeRendererNotification],
    ["ui.loadingIndicator", normalizeRendererLoadingIndicator],
    ["ui.previousTheme", normalizeRendererTheme],
    ["ui.sidebarCollapsed", normalizeRendererSidebarCollapsed],
    ["ui.theme", normalizeRendererTheme],
    ["ui.unloadButtonVisible", normalizeRendererUnloadButtonVisible],
]);
const BROWSER_STATE_PATH_NORMALIZERS = new Map<
    string,
    (value: unknown) => unknown
>([
    ["browser.listing", normalizeBrowserListingState],
    ["browser.scan", normalizeBrowserScanState],
    ["browser.view", normalizeBrowserView],
]);
const CHART_STATE_PATH_NORMALIZERS = new Map<
    string,
    (value: unknown) => unknown
>([
    ["charts.isRendered", normalizeRendererRenderFlag],
    ["charts.isRendering", normalizeRendererRenderFlag],
    ["charts.tabActive", normalizeRendererRenderFlag],
]);
const FIT_FILE_STATE_PATH_NORMALIZERS = new Map<
    string,
    (value: unknown) => unknown
>([
    ["fitFile.currentFile", normalizeRendererCurrentFile],
    ["fitFile.loadingPhase", normalizeFitFileLoadingPhase],
    ["fitFile.loadingProgress", normalizeFitFileLoadingProgress],
    ["fitFile.loadingState", normalizeFitFileLoadingState],
]);
const MAP_STATE_PATH_NORMALIZERS = new Map<string, (value: unknown) => unknown>(
    [
        ["map.baseLayer", normalizeMapBaseLayer],
        ["map.isRendered", normalizeRendererRenderFlag],
        ["map.measurementMode", normalizeRendererRenderFlag],
    ]
);
const TABLE_STATE_PATH_NORMALIZERS = new Map<
    string,
    (value: unknown) => unknown
>([["tables.isRendered", normalizeRendererRenderFlag]]);

const stateListeners = new Map<string, Set<StateListener>>();
const stateManagerInitState: StateManagerInitState = { initialized: false };
const singletonStateSubscriptions = createSubscriptionRegistry();

function stateStorageRuntime(): StateStorageRuntime {
    return getStateStorageRuntime();
}

function stateManagerRuntime(): StateManagerRuntime {
    return getStateManagerRuntime();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeStateWriteValue(path: string, value: unknown): unknown {
    const rootNormalizer = ROOT_STATE_PATH_NORMALIZERS.get(path);
    if (rootNormalizer) {
        return rootNormalizer(value);
    }

    const uiNormalizer = UI_STATE_PATH_NORMALIZERS.get(path);
    if (uiNormalizer) {
        return uiNormalizer(value);
    }

    const browserNormalizer = BROWSER_STATE_PATH_NORMALIZERS.get(path);
    if (browserNormalizer) {
        return browserNormalizer(value);
    }

    if (path === "browser" && isRecord(value)) {
        return normalizeBrowserStateBranch(value);
    }

    const chartNormalizer = CHART_STATE_PATH_NORMALIZERS.get(path);
    if (chartNormalizer) {
        return chartNormalizer(value);
    }

    if (path === "charts" && isRecord(value)) {
        return normalizeRendererChartRenderStateBranch(value);
    }

    const fitFileNormalizer = FIT_FILE_STATE_PATH_NORMALIZERS.get(path);
    if (fitFileNormalizer) {
        return fitFileNormalizer(value);
    }

    if (path === "fitFile" && isRecord(value)) {
        const loadingNormalizedBranch = normalizeFitFileStateBranch(value);
        return normalizeRendererActiveFileFitFileBranch(
            loadingNormalizedBranch
        );
    }

    const mapNormalizer = MAP_STATE_PATH_NORMALIZERS.get(path);
    if (mapNormalizer) {
        return mapNormalizer(value);
    }

    if (path === "map" && isRecord(value)) {
        const baseLayerNormalizedBranch = normalizeMapStateBranch(value);
        return normalizeRendererMapRenderStateBranch(baseLayerNormalizedBranch);
    }

    const tableNormalizer = TABLE_STATE_PATH_NORMALIZERS.get(path);
    if (tableNormalizer) {
        return tableNormalizer(value);
    }

    if (path === "tables" && isRecord(value)) {
        return normalizeRendererTableRenderStateBranch(value);
    }

    if (RENDERER_ACTIVE_TAB_STATE_PATHS.has(path)) {
        return normalizeRendererActiveTab(value);
    }

    if (path === "ui" && isRecord(value)) {
        let normalizedBranch: Record<string, unknown> | undefined;

        for (const key of RENDERER_ACTIVE_TAB_UI_KEYS) {
            if (key in value) {
                normalizedBranch ??= { ...value };
                normalizedBranch[key] = normalizeRendererActiveTab(value[key]);
            }
        }

        const themeNormalizedBranch = normalizeRendererThemeUiBranch(
            normalizedBranch ?? value
        );
        if (themeNormalizedBranch !== (normalizedBranch ?? value)) {
            normalizedBranch = themeNormalizedBranch;
        }

        const notificationNormalizedBranch =
            normalizeRendererNotificationUiBranch(normalizedBranch ?? value);
        if (notificationNormalizedBranch !== (normalizedBranch ?? value)) {
            normalizedBranch = notificationNormalizedBranch;
        }

        const layoutNormalizedBranch = normalizeRendererLayoutUiBranch(
            normalizedBranch ?? value
        );
        if (layoutNormalizedBranch !== (normalizedBranch ?? value)) {
            normalizedBranch = layoutNormalizedBranch;
        }

        const dragDropNormalizedBranch = normalizeRendererDragDropUiBranch(
            normalizedBranch ?? value
        );
        if (dragDropNormalizedBranch !== (normalizedBranch ?? value)) {
            normalizedBranch = dragDropNormalizedBranch;
        }

        const activeFileNormalizedBranch = normalizeRendererActiveFileUiBranch(
            normalizedBranch ?? value
        );
        if (activeFileNormalizedBranch !== (normalizedBranch ?? value)) {
            normalizedBranch = activeFileNormalizedBranch;
        }

        const loadingNormalizedBranch = normalizeRendererLoadingUiBranch(
            normalizedBranch ?? value
        );
        if (loadingNormalizedBranch !== (normalizedBranch ?? value)) {
            normalizedBranch = loadingNormalizedBranch;
        }

        const exportNormalizedBranch = normalizeRendererExportUiBranch(
            normalizedBranch ?? value
        );
        if (exportNormalizedBranch !== (normalizedBranch ?? value)) {
            normalizedBranch = exportNormalizedBranch;
        }

        if (normalizedBranch) {
            return normalizedBranch;
        }
    }

    return value;
}

/**
 * Clears all registered state listeners for test isolation.
 */
export function __clearAllListenersForTests(): void {
    try {
        stateListeners.clear();
        clearSubscriptionRegistry(singletonStateSubscriptions);
        if (!stateManagerRuntime().isTestEnvironment()) {
            console.log("[StateManager] All listeners cleared (tests)");
        }
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
 * Gets state by dot-notation path.
 *
 * @param path - Dot-notation path to a state property.
 *
 * @returns State value at the path, or the root state for an empty path.
 */
export function getState<T = unknown>(
    path = ""
): T | AppStateShape | undefined {
    const rootState = getRootState();

    if (!path) {
        return rootState;
    }

    const keys = path.split(".");
    let value: unknown = rootState;

    for (const key of keys) {
        if (!isRecord(value)) {
            return undefined;
        }

        if (!Object.hasOwn(value, key)) {
            return undefined;
        }

        value = value[key];
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
        paths: [...stateListeners.keys()],
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
 * Initializes the state manager with persisted state subscriptions.
 */
export function initializeStateManager(): void {
    if (stateManagerInitState.initialized) {
        console.log(
            "[StateManager] initializeStateManager invoked multiple times; ignoring subsequent calls"
        );
        return;
    }

    loadPersistedState();

    subscribe("ui", () => persistState(["ui"]));
    subscribe("charts.controlsVisible", () =>
        persistState(["charts.controlsVisible"])
    );
    subscribe("map.baseLayer", () => persistState(["map.baseLayer"]));
    subscribe("browser.view", () => persistState(["browser.view"]));

    stateManagerInitState.initialized = true;

    console.log("[StateManager] Initialized with persistence subscriptions");
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
        const savedState = stateStorageRuntime().getItem("fitFileViewer_state");
        if (savedState === null || savedState === "") {
            return;
        }

        const parsedState: unknown = JSON.parse(savedState);

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
        const existingRaw = stateStorageRuntime().getItem(
            "fitFileViewer_state"
        );
        if (existingRaw !== null && existingRaw !== "") {
            const parsed: unknown = JSON.parse(existingRaw);
            if (isRecord(parsed)) {
                stateToSave = parsed;
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
        const didPersist = stateStorageRuntime().setItem(
            "fitFileViewer_state",
            JSON.stringify(stateToSave)
        );
        if (!didPersist) {
            return;
        }

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
    let target: unknown = getRootState();

    for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (key) {
            if (!isRecord(target)) {
                console.warn("[StateManager] Invalid target for path", path);
                return;
            }

            const nextValue = target[key];
            if (!isRecord(nextValue)) {
                const container: Record<string, unknown> = {};
                target[key] = container;
                target = container;
                continue;
            }

            target = nextValue;
        }
    }

    const finalKey = keys.at(-1);
    if (typeof finalKey !== "string" || !finalKey) {
        console.warn("[StateManager] Invalid final key for path", path);
        return;
    }

    if (!isRecord(target)) {
        console.warn("[StateManager] Invalid target for path", path);
        return;
    }

    const normalizedValue = normalizeStateWriteValue(path, value);
    const mergedValue = getMergedStateValue(merge, oldValue, normalizedValue);
    const nextValue = mergedValue ? mergedValue : normalizedValue;
    target[finalKey] = nextValue;

    const hasChanged = !Object.is(oldValue, nextValue);
    if (hasChanged) {
        if (stateHistory.length >= MAX_HISTORY_SIZE) {
            stateHistory.shift();
        }

        stateHistory.push({
            newValue: normalizedValue,
            oldValue,
            path,
            source,
            timestamp: stateManagerRuntime().dateNow(),
        });
    }

    if (!silent && hasChanged) {
        notifyListeners(path, normalizedValue, oldValue);
    }

    if (hasChanged || source.includes("dev") || source.includes("debug")) {
        console.log(`[StateManager] ${path} updated by ${source}:`, {
            newValue: normalizedValue,
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

function createSubscriptionRegistry(): Record<string, Unsubscribe> {
    const registry: Record<string, Unsubscribe> = {};
    Object.setPrototypeOf(registry, null);
    return registry;
}

function clearSubscriptionRegistry(
    registry: Record<string, Unsubscribe>
): void {
    for (const key of Object.keys(registry)) {
        delete registry[key];
    }
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
    const key = id.trim();

    if (!key) {
        return subscribe(path, callback);
    }

    try {
        const existingUnsubscribe = singletonStateSubscriptions[key];
        if (typeof existingUnsubscribe === "function") {
            existingUnsubscribe();
        }
    } catch {
        // Ignore cleanup errors from previous subscriptions.
    }

    const unsubscribe = subscribe(path, callback);
    singletonStateSubscriptions[key] = unsubscribe;

    return () => {
        try {
            if (singletonStateSubscriptions[key] === unsubscribe) {
                delete singletonStateSubscriptions[key];
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

function getMergedStateValue(
    merge: boolean,
    oldValue: unknown,
    value: unknown
): Record<string, unknown> | undefined {
    return merge && isRecord(oldValue) && isRecord(value)
        ? { ...oldValue, ...value }
        : undefined;
}
