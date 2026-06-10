/**
 * State Integration Utilities Helps migrate from existing state patterns to the
 * new centralized system
 */

import {
    getState,
    initializeStateManager,
    setState,
    subscribe,
} from "../core/stateManager.js";
import { uiStateManager } from "../domain/uiStateManager.js";

type MigrationFunction = () => Promise<unknown> | unknown;

type PerformanceMemory = {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};

type PerformanceWithMemory = Performance & {
    memory?: PerformanceMemory;
};

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

let performanceMonitoringInterval: ReturnType<typeof setInterval> | undefined,
    persistenceTimeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Migration helper to convert old state patterns to new system
 */
export class StateMigrationHelper {
    private readonly migrations: MigrationFunction[] = [];

    /**
     * Add a migration function
     *
     * @param migrationFn - Function to run migration.
     */
    public addMigration(migrationFn: MigrationFunction): void {
        this.migrations.push(migrationFn);
    }

    /**
     * Run all migrations
     */
    public async runMigrations(): Promise<void> {
        console.log("[StateMigration] Running state migrations...");

        for (const migration of this.migrations) {
            try {
                await migration();
            } catch (error) {
                console.error("[StateMigration] Migration failed:", error);
            }
        }

        console.log("[StateMigration] All migrations completed");
    }
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
 * Deprecated compatibility shim retained for existing imports.
 */
export function migrateChartControlsState(): void {
    // State now flows directly through charts.controlsVisible.
}

/**
 * Set up performance monitoring for state changes
 */
export function setupStatePerformanceMonitoring(): void {
    let lastResetTime = Date.now(),
        stateChangeCount = 0;

    // Monitor state change frequency
    subscribe("", () => {
        stateChangeCount += 1;

        // Reset counter every minute and log stats
        const now = Date.now();
        if (now - lastResetTime > 60_000) {
            console.log(
                `[StatePerformance] ${stateChangeCount} state changes in the last minute`
            );
            stateChangeCount = 0;
            lastResetTime = now;
        }
    });

    if (typeof performance === "undefined") {
        return;
    }

    const perfMemory = performance as PerformanceWithMemory;
    if (!perfMemory.memory) {
        return;
    }

    if (performanceMonitoringInterval !== undefined) {
        clearInterval(performanceMonitoringInterval);
        performanceMonitoringInterval = undefined;
    }

    performanceMonitoringInterval = setInterval(() => {
        const memory = perfMemory.memory,
            memoryInfo = {
                limit: Math.round((memory?.jsHeapSizeLimit ?? 0) / 1024 / 1024),
                total: Math.round((memory?.totalJSHeapSize ?? 0) / 1024 / 1024),
                used: Math.round((memory?.usedJSHeapSize ?? 0) / 1024 / 1024),
            };

        setState("performance.memoryUsage", memoryInfo, {
            silent: true,
            source: "performanceMonitoring",
        });
    }, 30_000);
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
                clearTimeout(persistenceTimeout);
                persistenceTimeout = undefined;
            }

            persistenceTimeout = setTimeout(() => {
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
    return typeof localStorage === "undefined" ? undefined : localStorage;
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
