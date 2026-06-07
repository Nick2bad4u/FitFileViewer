import { getGlobalData, setGlobalData } from "./globalDataStore.js";
import {
    getState as getNewState,
    setState as setNewState,
    subscribe as subscribeNew,
    type StateUpdateOptions,
} from "./stateManager.js";

type UnifiedStateOptions = {
    readonly silent?: boolean;
    readonly source?: string;
    readonly syncLegacy?: boolean;
};

type UnifiedStateInitOptions = {
    readonly enableDebug?: boolean;
    readonly enableSync?: boolean;
};

type ConsistencyIssue = {
    readonly legacyValue: unknown;
    readonly newValue: unknown;
    readonly path: string;
    readonly type: "value_mismatch";
};

type ConsistencyWarning = {
    readonly error: string;
    readonly path: string;
    readonly type: "access_error";
};

type ConsistencyValidationResult = {
    readonly isValid: boolean;
    readonly issues: ConsistencyIssue[];
    readonly timestamp: number;
    readonly warnings: ConsistencyWarning[];
};

type UnifiedStateSnapshot = {
    readonly debugMode: boolean;
    readonly legacyPaths: string[];
    readonly newState: unknown;
    readonly syncEnabled: boolean;
    readonly timestamp: number;
};

type Unsubscribe = () => void;

const LEGACY_PATHS = new Set([
    "autoUpdaterInitialized",
    "globalData",
    "loadedFitFilePath",
    "mainWindow",
]);

/**
 * Single interface for routing state access during the legacy-to-modern state
 * migration.
 */
export class UnifiedStateManager {
    private debugMode = false;

    private readonly legacyWarningsShown = new Set<string>();

    private syncEnabled = true;

    /** Disables verbose state-routing diagnostics. */
    public disableDebugMode(): void {
        this.debugMode = false;
    }

    /** Enables verbose state-routing diagnostics. */
    public enableDebugMode(): void {
        this.debugMode = true;
        console.log("[UnifiedState] Debug mode enabled");
    }

    /** Gets a state value through the unified routing facade. */
    public get(path: string, defaultValue?: unknown): unknown {
        try {
            if (this.isLegacyPath(path)) {
                return this.getLegacyState(path, defaultValue);
            }

            return getNewState(path) ?? defaultValue;
        } catch (error) {
            if (this.debugMode) {
                console.warn(
                    `[UnifiedState] Failed to get state for path "${path}":`,
                    error
                );
            }

            return defaultValue;
        }
    }

    /** Gets a snapshot of the current unified state manager routing state. */
    public getSnapshot(): UnifiedStateSnapshot {
        return {
            debugMode: this.debugMode,
            legacyPaths: [...LEGACY_PATHS],
            newState: getNewState(""),
            syncEnabled: this.syncEnabled,
            timestamp: Date.now(),
        };
    }

    /** Returns whether a path is still routed through a legacy state boundary. */
    public isLegacyPath(path: string): boolean {
        const [rootPath] = path.split(".");
        return typeof rootPath === "string" && LEGACY_PATHS.has(rootPath);
    }

    /**
     * Sets a state value through the unified routing facade.
     *
     * @throws Error when the underlying modern state update fails.
     */
    public set(
        path: string,
        value: unknown,
        options: UnifiedStateOptions = {}
    ): void {
        const opts = {
            silent: false,
            source: "unified",
            syncLegacy: true,
            ...options,
        } satisfies Required<UnifiedStateOptions>;

        try {
            if (this.isLegacyPath(path)) {
                if (path === "globalData") {
                    setGlobalData(value, {
                        source: `${opts.source}-legacy-sync`,
                        silent: opts.silent,
                    });
                } else {
                    this.setLegacyState(path);
                }

                if (
                    path !== "globalData" &&
                    opts.syncLegacy &&
                    this.syncEnabled
                ) {
                    setNewState(path, value, {
                        source: `${opts.source}-legacy-sync`,
                        silent: opts.silent,
                    } satisfies StateUpdateOptions);
                }
            } else {
                setNewState(path, value, {
                    source: opts.source,
                    silent: opts.silent,
                } satisfies StateUpdateOptions);
            }

            if (this.debugMode) {
                console.log(`[UnifiedState] Set "${path}" =`, value, opts);
            }
        } catch (error) {
            console.error(
                `[UnifiedState] Failed to set state for path "${path}":`,
                error
            );
            throw error;
        }
    }

    /** Enables or disables syncing writes from legacy paths into modern state. */
    public setSyncEnabled(enabled: boolean): void {
        this.syncEnabled = enabled;
        if (this.debugMode) {
            console.log(
                `[UnifiedState] Legacy sync ${enabled ? "enabled" : "disabled"}`
            );
        }
    }

    /**
     * Subscribes to modern state changes while guarding unsupported legacy
     * subscriptions.
     */
    public subscribe(
        path: string,
        callback: (newValue: unknown, oldValue: unknown, path: string) => void
    ): Unsubscribe {
        if (this.isLegacyPath(path)) {
            console.warn(
                `[UnifiedState] Legacy path "${path}" subscriptions not fully supported`
            );
            return () => {
                // Legacy subscriptions are intentionally unsupported.
            };
        }

        return subscribeNew(path, callback);
    }

    /** Checks for value mismatches between legacy and modern state boundaries. */
    public validateConsistency(): ConsistencyValidationResult {
        const issues: ConsistencyIssue[] = [];
        const warnings: ConsistencyWarning[] = [];

        for (const legacyPath of LEGACY_PATHS) {
            try {
                const legacyValue = this.getLegacyState(legacyPath);
                const newValue = getNewState(legacyPath);

                if (
                    legacyValue !== undefined &&
                    newValue !== undefined &&
                    legacyValue !== newValue
                ) {
                    issues.push({
                        legacyValue,
                        newValue,
                        path: legacyPath,
                        type: "value_mismatch",
                    });
                }
            } catch (error) {
                warnings.push({
                    error:
                        error instanceof Error ? error.message : String(error),
                    path: legacyPath,
                    type: "access_error",
                });
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
            timestamp: Date.now(),
            warnings,
        };
    }

    private getLegacyState(path: string, defaultValue?: unknown): unknown {
        this.warnLegacyPathOnce(path, "Accessing");

        if (path === "globalData") {
            return getGlobalData() ?? defaultValue;
        }

        return defaultValue;
    }

    private setLegacyState(path: string): void {
        this.warnLegacyPathOnce(path, "Setting");
    }

    private warnLegacyPathOnce(
        path: string,
        action: "Accessing" | "Setting"
    ): void {
        if (this.legacyWarningsShown.has(path)) {
            return;
        }

        console.warn(
            `[UnifiedState] ${action} legacy state path "${path}". Consider migrating to new state system.`
        );
        this.legacyWarningsShown.add(path);
    }
}

/** Singleton unified state manager used during the state migration. */
export const unifiedState = new UnifiedStateManager();

/** Gets a state value through the singleton unified state manager. */
export function get(path: string, defaultValue?: unknown): unknown {
    return unifiedState.get(path, defaultValue);
}

/** Sets a state value through the singleton unified state manager. */
export function set(
    path: string,
    value: unknown,
    options: UnifiedStateOptions = {}
): void {
    unifiedState.set(path, value, options);
}

/** Subscribes to state changes through the singleton unified state manager. */
export function subscribe(
    path: string,
    callback: (newValue: unknown, oldValue: unknown, path: string) => void
): Unsubscribe {
    return unifiedState.subscribe(path, callback);
}

/**
 * Initializes unified state management and reports any initial consistency
 * issues.
 */
export function initializeUnifiedState(
    options: UnifiedStateInitOptions = {}
): UnifiedStateManager {
    const { enableDebug = false, enableSync = true } = options;

    if (enableDebug) {
        unifiedState.enableDebugMode();
    }

    unifiedState.setSyncEnabled(enableSync);

    const validation = unifiedState.validateConsistency();
    if (!validation.isValid) {
        console.warn(
            "[UnifiedState] State consistency issues detected:",
            validation.issues
        );
    }

    if (validation.warnings.length > 0) {
        console.warn(
            "[UnifiedState] State access warnings:",
            validation.warnings
        );
    }

    console.log("[UnifiedState] Unified state management initialized");
    return unifiedState;
}

export default unifiedState;
