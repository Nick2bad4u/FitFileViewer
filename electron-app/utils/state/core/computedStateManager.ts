import { getState, subscribe } from "./stateManager.js";
import type { AppStateShape } from "./stateManagerDefaults.js";
import { normalizeRendererActiveTab } from "../domain/rendererActiveTabState.js";
import {
    getComputedStateManagerRuntime,
    type ComputedStateManagerRuntime,
} from "./computedStateManagerRuntime.js";

type Unsubscribe = () => void;
type ComputedFunction = (state: ComputedStateInput) => unknown;

type ComputedValue = {
    readonly computeFn: ComputedFunction;
    readonly deps: string[];
    error: unknown;
    isValid: boolean;
    lastComputed: number | null;
    value: unknown;
};

type ComputedStateInput = AppStateShape & {
    fitFile?: AppStateShape["fitFile"] & {
        rawData?: FitComputedData | null;
    };
    settings?: {
        mapTheme?: boolean;
        theme?: "auto" | "dark" | "light" | string;
    };
    system?: AppStateShape["system"] & {
        lastActivity?: number;
    };
    ui?: AppStateShape["ui"] & {
        controlsEnabled?: boolean;
        loading?: boolean;
        notifications?: unknown[];
        tabs?: Record<string, unknown>;
        tabsVisible?: boolean;
    };
};

type FitComputedData = {
    recordMesgs?: FitRecordMessage[];
    sessionMesgs?: FitSessionMessage[];
};

type FitRecordMessage = {
    positionLat?: unknown;
    positionLong?: unknown;
};

type FitSessionMessage = {
    avgHeartRate?: unknown;
    avgPower?: unknown;
    avgSpeed?: unknown;
    maxHeartRate?: unknown;
    maxPower?: unknown;
    maxSpeed?: unknown;
    totalAscent?: unknown;
    totalDescent?: unknown;
    totalDistance?: unknown;
    totalElapsedTime?: unknown;
};

type ComputedSnapshot = Record<
    string,
    {
        dependencies: string[] | undefined;
        error: unknown;
        isValid: boolean;
        lastComputed: number | null;
        value: unknown;
    }
>;

type DependencyGraph = Record<string, string[]>;

type ReactiveComputedDescriptor = PropertyDescriptor & {
    get(): unknown;
};

function computedStateManagerRuntime(): ComputedStateManagerRuntime {
    return getComputedStateManagerRuntime();
}

function getComputedStateInput(): ComputedStateInput {
    return getState("") as ComputedStateInput;
}

function getRecordMessages(state: ComputedStateInput): FitRecordMessage[] {
    return getRawFitData(state)?.recordMesgs ?? [];
}

function getRawFitData(state: ComputedStateInput): FitComputedData | null {
    return state.fitFile?.rawData ?? null;
}

function hasLoadedRawFitData(state: ComputedStateInput): boolean {
    const rawData = getRawFitData(state);
    return (
        rawData !== null &&
        typeof rawData === "object" &&
        Object.keys(rawData).length > 0
    );
}

function isDarkSchemePreferred(): boolean {
    return computedStateManagerRuntime().isDarkSchemePreferred();
}

/**
 * Manages derived values that recompute from state dependencies.
 */
class ComputedStateManager {
    private readonly computedValues = new Map<string, ComputedValue>();

    private readonly dependencies = new Map<string, string[]>();

    private readonly isComputing = new Set<string>();

    private readonly subscriptions = new Map<string, Unsubscribe[]>();

    /**
     * Registers a computed value and subscribes it to dependency invalidations.
     */
    public addComputed(
        key: string,
        computeFn: ComputedFunction,
        deps: string[] = []
    ): Unsubscribe {
        if (this.computedValues.has(key)) {
            console.warn(
                `[ComputedState] Computed value "${key}" already exists, replacing...`
            );
            this.removeComputed(key);
        }

        this.computedValues.set(key, {
            computeFn,
            deps,
            error: null,
            isValid: false,
            lastComputed: null,
            value: undefined,
        });

        this.dependencies.set(key, deps);

        const subscriptions = deps.map((dep) =>
            subscribe(dep, () => {
                this.invalidateComputed(key);
            })
        );

        this.subscriptions.set(key, subscriptions);
        this.computeValue(key);

        console.log(
            `[ComputedState] Registered computed value "${key}" with dependencies:`,
            deps
        );

        return () => {
            this.removeComputed(key);
        };
    }

    /** Cleans up all computed values and dependency subscriptions. */
    public cleanup(): void {
        console.log("[ComputedState] Cleaning up all computed values...");

        for (const subscriptions of this.subscriptions.values()) {
            for (const unsubscribe of subscriptions) {
                unsubscribe();
            }
        }

        this.computedValues.clear();
        this.dependencies.clear();
        this.subscriptions.clear();
        this.isComputing.clear();
    }

    /** Computes a value by key if it exists and is not already computing. */
    public computeValue(key: string): void {
        const computed = this.computedValues.get(key);
        if (!computed) {
            return;
        }

        if (this.isComputing.has(key)) {
            console.error(
                `[ComputedState] Circular dependency detected for computed value "${key}"`
            );
            return;
        }

        this.isComputing.add(key);

        try {
            const startTime = computedStateManagerRuntime().nowPerformance();
            const state = getComputedStateInput();
            const newValue = computed.computeFn(state);
            const duration =
                computedStateManagerRuntime().nowPerformance() - startTime;

            computed.value = newValue;
            computed.isValid = true;
            computed.lastComputed = computedStateManagerRuntime().dateNow();
            computed.error = null;

            if (duration > 10) {
                console.warn(
                    `[ComputedState] Slow computation for "${key}": ${duration.toFixed(2)}ms`
                );
            }

            console.log(
                `[ComputedState] Computed value "${key}" updated in ${duration.toFixed(2)}ms`
            );
        } catch (error) {
            console.error(
                `[ComputedState] Error computing value for "${key}":`,
                error
            );
            computed.error = error;
            computed.isValid = false;
        } finally {
            this.isComputing.delete(key);
        }
    }

    /** Alias for addComputed for backward compatibility. */
    public define(
        key: string,
        computeFn: ComputedFunction,
        deps: string[] = []
    ): Unsubscribe {
        return this.addComputed(key, computeFn, deps);
    }

    /** Gets all computed values with metadata. */
    public getAllComputed(): ComputedSnapshot {
        const result: ComputedSnapshot = {};

        for (const [key, computed] of this.computedValues.entries()) {
            result[key] = {
                dependencies: this.dependencies.get(key),
                error: computed.error,
                isValid: computed.isValid,
                lastComputed: computed.lastComputed,
                value: computed.value,
            };
        }

        return result;
    }

    /** Gets a computed value, recomputing invalid entries first. */
    public getComputed(key: string): unknown {
        const computed = this.computedValues.get(key);
        if (!computed) {
            console.warn(
                `[ComputedState] Computed value "${key}" does not exist`
            );
            return undefined;
        }

        if (!computed.isValid || computed.error) {
            this.computeValue(key);
        }

        return computed.value;
    }

    /** Gets dependency relationships for debugging. */
    public getDependencyGraph(): DependencyGraph {
        const graph: DependencyGraph = {};

        for (const [key, deps] of this.dependencies.entries()) {
            graph[key] = deps;
        }

        return graph;
    }

    /** Marks a computed value as stale. */
    public invalidateComputed(key: string): void {
        const computed = this.computedValues.get(key);
        if (!computed) {
            return;
        }

        computed.isValid = false;
        computed.error = null;

        console.log(`[ComputedState] Invalidated computed value "${key}"`);
    }

    /** Forces recomputation of all computed values. */
    public recomputeAll(): void {
        console.log("[ComputedState] Recomputing all computed values...");

        for (const key of this.computedValues.keys()) {
            this.invalidateComputed(key);
            this.computeValue(key);
        }
    }

    /** Removes a computed value and its dependency subscriptions. */
    public removeComputed(key: string): void {
        if (!this.computedValues.has(key)) {
            console.warn(
                `[ComputedState] Computed value "${key}" does not exist`
            );
            return;
        }

        const subscriptions = this.subscriptions.get(key) ?? [];
        for (const unsubscribe of subscriptions) {
            unsubscribe();
        }

        this.computedValues.delete(key);
        this.dependencies.delete(key);
        this.subscriptions.delete(key);
        this.isComputing.delete(key);

        console.log(`[ComputedState] Removed computed value "${key}"`);
    }
}

/** Global computed state manager. */
export const computedStateManager = new ComputedStateManager();

/** Registers a computed value. */
export function addComputed(
    key: string,
    computeFn: ComputedFunction,
    deps: string[] = []
): Unsubscribe {
    return computedStateManager.addComputed(key, computeFn, deps);
}

/** Cleans up common computed values. */
export function cleanupCommonComputedValues(): void {
    const commonKeys = [
        "isFileLoaded",
        "isAppReady",
        "hasChartData",
        "hasMapData",
        "summaryData",
        "performanceMetrics",
        "themeInfo",
        "uiStateSummary",
    ];

    for (const key of commonKeys) {
        removeComputed(key);
    }

    console.log("[ComputedState] Common computed values cleaned up");
}

/** Creates a property descriptor backed by a computed value. */
export function createReactiveComputed(
    key: string,
    computeFn: ComputedFunction,
    deps: string[] = []
): ReactiveComputedDescriptor {
    addComputed(key, computeFn, deps);

    return {
        configurable: true,
        enumerable: true,
        get() {
            return getComputed(key);
        },
    };
}

/** Alias for addComputed for backward compatibility. */
export function define(
    key: string,
    computeFn: ComputedFunction,
    deps: string[] = []
): Unsubscribe {
    return computedStateManager.define(key, computeFn, deps);
}

/** Gets a computed value. */
export function getComputed(key: string): unknown {
    return computedStateManager.getComputed(key);
}

let commonComputedValuesInitialized = false;

/** Initializes common computed values for the FitFileViewer application. */
export function initializeCommonComputedValues(): void {
    if (commonComputedValuesInitialized) {
        console.log(
            "[ComputedState] Common computed values already initialized, skipping..."
        );
        return;
    }

    console.log("[ComputedState] Initializing common computed values...");

    addComputed("isFileLoaded", hasLoadedRawFitData, ["fitFile.rawData"]);

    addComputed(
        "isAppReady",
        (state) => state.app.initialized && !state.app.isOpeningFile,
        ["app.initialized", "app.isOpeningFile"]
    );

    addComputed(
        "hasChartData",
        (state) => getRecordMessages(state).length > 0,
        ["fitFile.rawData.recordMesgs"]
    );

    addComputed(
        "hasMapData",
        (state) =>
            getRecordMessages(state).some(
                (record) =>
                    record.positionLat !== undefined &&
                    record.positionLong !== undefined
            ),
        ["fitFile.rawData.recordMesgs"]
    );

    addComputed(
        "summaryData",
        (state) => {
            const [session] = getRawFitData(state)?.sessionMesgs ?? [];
            if (!session) {
                return null;
            }

            return {
                avgHeartRate: session.avgHeartRate,
                avgPower: session.avgPower,
                avgSpeed: session.avgSpeed,
                maxHeartRate: session.maxHeartRate,
                maxPower: session.maxPower,
                maxSpeed: session.maxSpeed,
                totalAscent: session.totalAscent,
                totalDescent: session.totalDescent,
                totalDistance: session.totalDistance,
                totalTime: session.totalElapsedTime,
            };
        },
        ["fitFile.rawData.sessionMesgs"]
    );

    addComputed(
        "performanceMetrics",
        (state) => {
            const startTime = state.app.startTime;
            if (!startTime) {
                return null;
            }

            return {
                isFileLoaded: hasLoadedRawFitData(state),
                lastActivity: state.system?.lastActivity ?? startTime,
                tabsEnabled: state.ui?.tabs ?? {},
                uptime: computedStateManagerRuntime().dateNow() - startTime,
            };
        },
        [
            "app.startTime",
            "fitFile.rawData",
            "ui.tabs",
            "system.lastActivity",
        ]
    );

    addComputed(
        "themeInfo",
        (state) => {
            const mapTheme = state.settings?.mapTheme ?? true;
            const theme = state.settings?.theme ?? "dark";
            const darkSchemePreferred = isDarkSchemePreferred();

            return {
                currentTheme: theme,
                isDarkTheme:
                    theme === "dark" ||
                    (theme === "auto" && darkSchemePreferred),
                isLightTheme:
                    theme === "light" ||
                    (theme === "auto" && !darkSchemePreferred),
                mapThemeInverted: mapTheme,
            };
        },
        ["settings.theme", "settings.mapTheme"]
    );

    addComputed(
        "uiStateSummary",
        (state) => ({
            activeTab: normalizeRendererActiveTab(state.ui?.activeTab),
            controlsEnabled: state.ui?.controlsEnabled ?? false,
            loadingState: state.ui?.loading ?? false,
            notificationCount: state.ui?.notifications?.length ?? 0,
            tabsVisible: state.ui?.tabsVisible ?? false,
        }),
        [
            "ui.activeTab",
            "ui.loading",
            "ui.notifications",
            "ui.controlsEnabled",
            "ui.tabsVisible",
        ]
    );

    commonComputedValuesInitialized = true;
    console.log("[ComputedState] Common computed values initialized");
}

/** Removes a computed value. */
export function removeComputed(key: string): void {
    computedStateManager.removeComputed(key);
}
