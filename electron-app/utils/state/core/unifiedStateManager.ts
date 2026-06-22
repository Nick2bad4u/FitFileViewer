import {
    getState as getNewState,
    setState as setNewState,
    subscribe as subscribeNew,
    type StateUpdateOptions,
} from "./stateManager.js";

type UnifiedStateOptions = {
    readonly silent?: boolean;
    readonly source?: string;
};

type UnifiedStateInitOptions = {
    readonly enableDebug?: boolean;
};

type UnifiedStateSnapshot = {
    readonly debugMode: boolean;
    readonly newState: unknown;
    readonly timestamp: number;
};

type Unsubscribe = () => void;

const BLOCKED_STATE_PATHS = new Set(["globalData"]);

/**
 * Single interface for guarded state access during the state migration.
 */
export class UnifiedStateManager {
    private debugMode = false;

    private readonly blockedWarningsShown = new Set<string>();

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
            if (this.isBlockedStatePath(path)) {
                this.warnBlockedStatePathOnce(path, "Accessing");
                return defaultValue;
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
            newState: getNewState(""),
            timestamp: Date.now(),
        };
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
            ...options,
        } satisfies Required<UnifiedStateOptions>;

        try {
            if (this.isBlockedStatePath(path)) {
                this.warnBlockedStatePathOnce(path, "Setting");
                return;
            }

            setNewState(path, value, {
                source: opts.source,
                silent: opts.silent,
            } satisfies StateUpdateOptions);

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

    /**
     * Subscribes to modern state changes while guarding unsupported retired
     * subscriptions.
     */
    public subscribe(
        path: string,
        callback: (newValue: unknown, oldValue: unknown, path: string) => void
    ): Unsubscribe {
        if (this.isBlockedStatePath(path)) {
            this.warnBlockedStatePathOnce(path, "Subscribing to");
            return () => {
                // Retired state paths are intentionally unsupported.
            };
        }

        return subscribeNew(path, callback);
    }

    private isBlockedStatePath(path: string): boolean {
        const [rootPath] = path.split(".");
        return (
            typeof rootPath === "string" && BLOCKED_STATE_PATHS.has(rootPath)
        );
    }

    private warnBlockedStatePathOnce(
        path: string,
        action: "Accessing" | "Setting" | "Subscribing to"
    ): void {
        if (this.blockedWarningsShown.has(path)) {
            return;
        }

        console.warn(
            `[UnifiedState] ${action} retired state path "${path}". Use the explicit FIT state slices instead.`
        );
        this.blockedWarningsShown.add(path);
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
    const { enableDebug = false } = options;

    if (enableDebug) {
        unifiedState.enableDebugMode();
    }

    console.log("[UnifiedState] Unified state management initialized");
    return unifiedState;
}

export default unifiedState;
