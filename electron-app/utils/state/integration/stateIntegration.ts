/**
 * State Integration Utilities Helps migrate from existing state patterns to the
 * new centralized system
 */

import { AppActions } from "../../app/lifecycle/appActions.js";
import type { ElectronAPIWithDevFlags } from "../../../shared/preloadApi.js";
import {
    getState,
    initializeStateManager,
    setState,
    subscribe,
} from "../core/stateManager.js";
import { uiStateManager } from "../domain/uiStateManager.js";

type MigrationFunction = () => Promise<unknown> | unknown;
type Unsubscribe = () => void;

type ChartControlsState = {
    isVisible?: unknown;
};

type PerformanceMemory = {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};

type PerformanceWithMemory = Performance & {
    memory?: PerformanceMemory;
};

type DebugUtilities = {
    AppActions: typeof AppActions;
    getState: typeof getState;
    logState: (path?: string) => unknown;
    setState: typeof setState;
    triggerAction: (actionName: string, ...args: unknown[]) => unknown;
    uiStateManager: typeof uiStateManager;
    watchState: (path: string) => Unsubscribe;
};

type StateIntegrationGlobal = typeof globalThis & {
    __DEVELOPMENT__?: boolean;
    __performanceMonitoringInterval?: ReturnType<typeof setInterval>;
    __persistenceTimeout?: ReturnType<typeof setTimeout>;
    __state_debug?: DebugUtilities;
    chartControlsState?: ChartControlsState;
    electronAPI?: Partial<Pick<ElectronAPIWithDevFlags, "__devMode">>;
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

    // Set up state debugging in development
    if (isDevelopmentMode()) {
        setupStateDebugging();
    }

    console.log("[StateIntegration] Application state management initialized");
}

/**
 * Initializes every state integration layer used by the renderer.
 */
export function initializeCompleteStateSystem(): void {
    initializeAppState();
    migrateChartControlsState();
    setupStatePersistence();
    setupStatePerformanceMonitoring();

    console.log("[StateIntegration] Complete state system initialized");
}

/**
 * Helper to convert existing chartControlsState to new system
 */
export function migrateChartControlsState(): void {
    const integrationGlobal = getIntegrationGlobal();
    if (!integrationGlobal.chartControlsState) {
        return;
    }

    console.log("[StateMigration] Migrating chartControlsState...");

    setState(
        "charts.controlsVisible",
        integrationGlobal.chartControlsState.isVisible,
        {
            source: "migration",
        }
    );

    integrationGlobal.chartControlsState = {
        get isVisible() {
            return getState("charts.controlsVisible");
        },
        set isVisible(value: unknown) {
            setState("charts.controlsVisible", value, {
                source: "chartControlsState",
            });
        },
    };

    console.log("[StateMigration] chartControlsState migrated");
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

    const integrationGlobal = getIntegrationGlobal();
    if (integrationGlobal.__performanceMonitoringInterval !== undefined) {
        clearInterval(integrationGlobal.__performanceMonitoringInterval);
    }

    integrationGlobal.__performanceMonitoringInterval = setInterval(() => {
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
            const integrationGlobal = getIntegrationGlobal();
            if (integrationGlobal.__persistenceTimeout !== undefined) {
                clearTimeout(integrationGlobal.__persistenceTimeout);
            }

            integrationGlobal.__persistenceTimeout = setTimeout(() => {
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

/**
 * Detects if the application is running in development mode Since process is
 * not available in renderer, we use alternative methods
 *
 * @returns True if in development mode.
 */
function isDevelopmentMode(): boolean {
    // Guarded access for jsdom/mocked environments
    try {
        const integrationGlobal = getIntegrationGlobal(),
            loc =
                integrationGlobal.window === undefined
                    ? undefined
                    : integrationGlobal.location,
            hostname = typeof loc?.hostname === "string" ? loc.hostname : "",
            search = typeof loc?.search === "string" ? loc.search : "",
            hash = typeof loc?.hash === "string" ? loc.hash : "",
            protocol = typeof loc?.protocol === "string" ? loc.protocol : "",
            href = typeof loc?.href === "string" ? loc.href : "";

        return (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            (hostname !== "" && hostname.includes("dev")) ||
            integrationGlobal.__DEVELOPMENT__ === true ||
            (search !== "" && search.includes("debug=true")) ||
            (hash !== "" && hash.includes("debug")) ||
            (typeof document !== "undefined" &&
                document.documentElement &&
                Object.hasOwn(document.documentElement.dataset, "devMode")) ||
            protocol === "file:" ||
            (integrationGlobal.window !== undefined &&
                integrationGlobal.electronAPI?.__devMode !== undefined) ||
            (typeof console !== "undefined" && href.includes("electron"))
        );
    } catch {
        // Default to non-dev on any unexpected error
        return false;
    }
}

/**
 * Sets up debug utilities for development mode
 */
function setupStateDebugging(): void {
    const debugUtilities: DebugUtilities = {
        AppActions,
        getState,
        logState(path?: string) {
            const state = path ? getState(path) : getState("data");
            console.log(
                `[StateDebug] Current state${path ? ` for ${path}` : ""}:`,
                state
            );
            return state;
        },
        setState,
        triggerAction(actionName: string, ...args: unknown[]) {
            const action = Reflect.get(AppActions, actionName);

            if (typeof action === "function") {
                console.log(
                    `[StateDebug] Triggering action: ${actionName}`,
                    args
                );
                return action(...args);
            }

            console.warn(`[StateDebug] Unknown action: ${actionName}`);
            return undefined;
        },
        uiStateManager,
        watchState(path: string) {
            console.log(`[StateDebug] Watching state changes for: ${path}`);
            return subscribe(path, (newValue, oldValue) => {
                console.log(`[StateDebug] ${path} changed:`, {
                    newValue,
                    oldValue,
                });
            });
        },
    };

    getIntegrationGlobal().__state_debug = debugUtilities;
}

function getIntegrationGlobal(): StateIntegrationGlobal {
    return globalThis;
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
