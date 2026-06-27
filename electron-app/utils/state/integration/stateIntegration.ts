/**
 * State Integration Utilities initialize the renderer state system and
 * synchronize persisted UI state.
 */

import {
    getState,
    initializeStateManager,
    setState,
    subscribe,
} from "../core/stateManager.js";
import { uiStateManager } from "../domain/uiStateManager.js";
import {
    getStateIntegrationRuntime,
    type StateIntegrationRuntime,
    type StateIntegrationInterval,
    type StateIntegrationTimeout,
} from "./stateIntegrationRuntime.js";

const PERSISTED_STATE_KEY = "fitFileViewer_uiState";
const PERSISTED_PATHS = [
    "ui.theme",
    "ui.sidebarCollapsed",
    "charts.controlsVisible",
    "charts.selectedChart",
    "map.baseLayer",
    "map.showElevationProfile",
    "tables.pageSize",
] as const;

let performanceMonitoringInterval: StateIntegrationInterval | undefined,
    persistenceTimeout: StateIntegrationTimeout | undefined;

function stateIntegrationRuntime(): StateIntegrationRuntime {
    return getStateIntegrationRuntime();
}

/**
 * Initialize the complete state management system Call this once during
 * application startup
 */
export function initializeAppState(): void {
    console.log(
        "[StateIntegration] Initializing application state management..."
    );

    // Initialize core state manager
    initializeStateManager();
    // Initialize UI state manager
    uiStateManager.initialize();

    console.log("[StateIntegration] Application state management initialized");
}

/**
 * Initializes every state integration layer used by the renderer.
 */
export function initializeCompleteStateSystem(): void {
    initializeAppState();
    setupStatePersistence();
    setupStatePerformanceMonitoring();

    console.log("[StateIntegration] Complete state system initialized");
}

/**
 * Set up performance monitoring for state changes
 */
export function setupStatePerformanceMonitoring(): void {
    let lastResetTime = stateIntegrationRuntime().dateNow(),
        stateChangeCount = 0;

    // Monitor state change frequency
    subscribe("", () => {
        stateChangeCount += 1;

        // Reset counter every minute and log stats
        const now = stateIntegrationRuntime().dateNow();
        if (now - lastResetTime > 60_000) {
            console.log(
                `[StatePerformance] ${stateChangeCount} state changes in the last minute`
            );
            stateChangeCount = 0;
            lastResetTime = now;
        }
    });

    const perfMemory = stateIntegrationRuntime().getPerformanceMemory();
    if (!perfMemory) {
        return;
    }

    if (performanceMonitoringInterval !== undefined) {
        stateIntegrationRuntime().clearInterval(performanceMonitoringInterval);
        performanceMonitoringInterval = undefined;
    }

    performanceMonitoringInterval = stateIntegrationRuntime().setInterval(
        () => {
            const memoryInfo = {
                limit: Math.round(perfMemory.jsHeapSizeLimit / 1024 / 1024),
                total: Math.round(perfMemory.totalJSHeapSize / 1024 / 1024),
                used: Math.round(perfMemory.usedJSHeapSize / 1024 / 1024),
            };

            setState("performance.memoryUsage", memoryInfo, {
                silent: true,
                source: "performanceMonitoring",
            });
        },
        30_000
    );
}

/**
 * Set up state persistence for important UI state
 */
export function setupStatePersistence(): void {
    const storage = getStorage();
    if (!storage) {
        return;
    }

    // Set up auto-persistence for these paths
    for (const path of PERSISTED_PATHS) {
        subscribe(path, () => {
            if (persistenceTimeout !== undefined) {
                stateIntegrationRuntime().clearTimeout(persistenceTimeout);
                persistenceTimeout = undefined;
            }

            persistenceTimeout = stateIntegrationRuntime().setTimeout(() => {
                persistenceTimeout = undefined;
                try {
                    const stateToSave: Record<string, unknown> = {};
                    for (const persistedPath of PERSISTED_PATHS) {
                        const value = getState(persistedPath);
                        if (value !== undefined) {
                            setNestedValue(stateToSave, persistedPath, value);
                        }
                    }

                    storage.setItem(
                        PERSISTED_STATE_KEY,
                        JSON.stringify(stateToSave)
                    );
                    console.log(
                        "[StateIntegration] UI state persisted to localStorage"
                    );
                } catch (error) {
                    console.error(
                        "[StateIntegration] Failed to persist state:",
                        error
                    );
                }
            }, 500);
        });
    }

    // Load persisted state on initialization
    try {
        const savedState = storage.getItem(PERSISTED_STATE_KEY);
        if (!savedState) {
            return;
        }

        const parsedState: unknown = JSON.parse(savedState);

        for (const path of PERSISTED_PATHS) {
            const value = getNestedValue(parsedState, path);
            if (value !== undefined) {
                setState(path, value, {
                    silent: true,
                    source: "localStorage",
                });
            }
        }

        console.log("[StateIntegration] UI state loaded from localStorage");
    } catch (error) {
        console.error(
            "[StateIntegration] Failed to load persisted state:",
            error
        );
    }
}

function getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split(".");
    let value = obj;

    for (const key of keys) {
        if (!isRecord(value)) {
            return undefined;
        }
        value = value[key];
    }

    return value;
}

function getStorage(): Storage | undefined {
    return stateIntegrationRuntime().getStorage();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
): void {
    const keys = path.split(".");
    let target = obj;

    for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (!key) {
            continue;
        }

        const nextTarget = target[key];
        if (!isRecord(nextTarget)) {
            const container: Record<string, unknown> = {};
            target[key] = container;
            target = container;
            continue;
        }

        target = nextTarget;
    }

    const finalKey = keys.at(-1);
    if (finalKey) {
        target[finalKey] = value;
    }
}
