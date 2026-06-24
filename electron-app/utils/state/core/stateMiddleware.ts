import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    getStateStorageRuntime,
    type StateStorageRuntime,
} from "./stateStorageRuntime.js";
import {
    getStateMiddlewareRuntime,
    type StateMiddlewareRuntime,
} from "./stateMiddlewareRuntime.js";

/** Middleware phases supported by the state middleware manager. */
export const MIDDLEWARE_PHASES = {
    AFTER_GET: "afterGet",
    AFTER_SET: "afterSet",
    BEFORE_GET: "beforeGet",
    BEFORE_SET: "beforeSet",
    ON_ERROR: "onError",
    ON_SUBSCRIBE: "onSubscribe",
    ON_UNSUBSCRIBE: "onUnsubscribe",
} as const;

type MiddlewarePhase =
    (typeof MIDDLEWARE_PHASES)[keyof typeof MIDDLEWARE_PHASES];

type MiddlewareHandlerPhase = Exclude<
    MiddlewarePhase,
    typeof MIDDLEWARE_PHASES.ON_ERROR
>;

/** Mutable context passed through middleware phase handlers. */
export type MiddlewareContext = {
    _startTime?: number;
    oldValue?: unknown;
    options?: Record<string, unknown>;
    path: string;
    value?: unknown;
};

type MiddlewareErrorContext = {
    context: MiddlewareContext;
    middleware: string;
    phase: string;
};

type MiddlewarePhaseResult =
    | false
    | MiddlewareContext
    | Promise<false | MiddlewareContext | void>
    | void;

/** Function signature for a normal middleware phase handler. */
export type MiddlewarePhaseHandler = (
    context: MiddlewareContext
) => MiddlewarePhaseResult;

/** Function signature for middleware error handlers. */
export type MiddlewareErrorHandler = (
    error: Error,
    errorContext?: MiddlewareErrorContext
) => Promise<void> | void;

/** Middleware registration shape accepted by the middleware manager. */
export type MiddlewareDefinition = Partial<
    Record<MiddlewareHandlerPhase, MiddlewarePhaseHandler>
> & {
    metadata?: Record<string, unknown>;
    onError?: MiddlewareErrorHandler;
};

type RegisteredMiddleware = {
    handlers: Partial<
        Record<MiddlewarePhase, MiddlewareErrorHandler | MiddlewarePhaseHandler>
    >;
    isEnabled: boolean;
    metadata: Record<string, unknown>;
    name: string;
    priority: number;
};

type MiddlewareInfo = {
    isEnabled: boolean;
    metadata: Record<string, unknown>;
    name: string;
    phases: string[];
    priority: number;
};

export type StatePerformanceEntry = {
    duration: number;
    path: string;
    timestamp: number;
};

const HANDLER_PHASES = [
    MIDDLEWARE_PHASES.AFTER_GET,
    MIDDLEWARE_PHASES.AFTER_SET,
    MIDDLEWARE_PHASES.BEFORE_GET,
    MIDDLEWARE_PHASES.BEFORE_SET,
    MIDDLEWARE_PHASES.ON_SUBSCRIBE,
    MIDDLEWARE_PHASES.ON_UNSUBSCRIBE,
] as const;
const statePerformanceHistory: StatePerformanceEntry[] = [];

function stateStorageRuntime(): StateStorageRuntime {
    return getStateStorageRuntime();
}

function stateMiddlewareRuntime(): StateMiddlewareRuntime {
    return getStateMiddlewareRuntime();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}

function toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

function getMessage(value: unknown): string {
    if (isRecord(value) && typeof value["message"] === "string") {
        return value["message"];
    }

    return String(value);
}

/** Returns the rolling performance history recorded by performance middleware. */
export function getStatePerformanceHistory(): readonly StatePerformanceEntry[] {
    return statePerformanceHistory;
}

/** Replaces performance history for focused tests and diagnostic resets. */
export function resetStatePerformanceHistory(
    entries: readonly StatePerformanceEntry[] = []
): void {
    statePerformanceHistory.length = 0;
    statePerformanceHistory.push(...entries.slice(-100));
}

/**
 * Runs state middleware by priority for state operations.
 */
class StateMiddlewareManager {
    private executionOrder: string[] = [];

    private isEnabled = true;

    private readonly middleware = new Map<string, RegisteredMiddleware>();

    /** Clears all registered middleware. */
    public clear(): void {
        this.middleware.clear();
        this.executionOrder = [];
        console.log("[StateMiddleware] All middleware cleared");
    }

    /** Executes middleware for a phase in priority order. */
    public async execute(
        phase: MiddlewarePhase | string,
        context: MiddlewareContext
    ): Promise<MiddlewareContext> {
        if (!this.isEnabled) {
            return context;
        }

        let currentContext = { ...context };

        for (const middlewareName of this.executionOrder) {
            const middleware = this.middleware.get(middlewareName);

            if (!middleware?.isEnabled) {
                continue;
            }

            const handler = middleware.handlers[phase as MiddlewarePhase];
            if (!handler || phase === MIDDLEWARE_PHASES.ON_ERROR) {
                continue;
            }

            try {
                const result = await (handler as MiddlewarePhaseHandler)(
                    currentContext
                );

                if (result && typeof result === "object") {
                    currentContext = result;
                }

                if (result === false) {
                    console.log(
                        `[StateMiddleware] Execution stopped by middleware "${middlewareName}"`
                    );
                    break;
                }
            } catch (error) {
                const err = toError(error);
                console.error(
                    `[StateMiddleware] Error in middleware "${middlewareName}" phase "${phase}":`,
                    err
                );

                await this.executeErrorHandlers(err, {
                    context: currentContext,
                    middleware: middlewareName,
                    phase,
                });
            }
        }

        return currentContext;
    }

    /** Executes middleware error handlers in priority order. */
    public async executeErrorHandlers(
        error: Error,
        errorContext: MiddlewareErrorContext
    ): Promise<void> {
        for (const middlewareName of this.executionOrder) {
            const middleware = this.middleware.get(middlewareName);

            if (!middleware?.isEnabled) {
                continue;
            }

            const errorHandler = middleware.handlers[
                MIDDLEWARE_PHASES.ON_ERROR
            ] as MiddlewareErrorHandler | undefined;
            if (!errorHandler) {
                continue;
            }

            try {
                try {
                    await (errorHandler.length >= 2
                        ? errorHandler(error, errorContext)
                        : errorHandler(error));
                } catch (error_) {
                    console.error(
                        "[StateMiddleware] Error invoking error handler",
                        error_
                    );
                }
            } catch (handlerError) {
                console.error(
                    `[StateMiddleware] Error in error handler for "${middlewareName}":`,
                    handlerError
                );
            }
        }
    }

    /** Gets registered middleware metadata for diagnostics. */
    public getMiddlewareInfo(): MiddlewareInfo[] {
        return [...this.middleware.values()].map((middleware) => ({
            isEnabled: middleware.isEnabled,
            metadata: middleware.metadata,
            name: middleware.name,
            phases: Object.keys(middleware.handlers),
            priority: middleware.priority,
        }));
    }

    /** Returns true when middleware with the given name is registered. */
    public has(name: string): boolean {
        return this.middleware.has(name);
    }

    /** Registers or replaces middleware. */
    public register(
        name: string,
        middleware: MiddlewareDefinition,
        priority = 100
    ): void {
        if (this.middleware.has(name)) {
            console.warn(
                `[StateMiddleware] Middleware "${name}" already registered, replacing...`
            );
        }

        const wrappedMiddleware: RegisteredMiddleware = {
            handlers: {},
            isEnabled: true,
            metadata: middleware.metadata ?? {},
            name,
            priority,
        };

        for (const phase of HANDLER_PHASES) {
            const original = middleware[phase];
            if (typeof original === "function") {
                wrappedMiddleware.handlers[phase] = this.wrapHandler(
                    name,
                    phase,
                    original
                );
            }
        }

        if (typeof middleware.onError === "function") {
            wrappedMiddleware.handlers[MIDDLEWARE_PHASES.ON_ERROR] =
                middleware.onError;
        }

        this.middleware.set(name, wrappedMiddleware);
        this.updateExecutionOrder();

        console.log(
            `[StateMiddleware] Registered middleware "${name}" with priority ${priority}`
        );
    }

    /** Enables or disables one middleware by name. */
    public setEnabled(name: string, enabled: boolean): boolean {
        const middleware = this.middleware.get(name);
        if (!middleware) {
            console.warn(`[StateMiddleware] Middleware "${name}" not found`);
            return false;
        }

        middleware.isEnabled = enabled;
        console.log(
            `[StateMiddleware] Middleware "${name}" ${enabled ? "enabled" : "disabled"}`
        );
        return true;
    }

    /** Enables or disables the whole middleware system. */
    public setGlobalEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        console.log(
            `[StateMiddleware] Middleware system ${enabled ? "enabled" : "disabled"}`
        );
    }

    /** Unregisters middleware by name. */
    public unregister(name: string): boolean {
        if (!this.middleware.has(name)) {
            console.warn(`[StateMiddleware] Middleware "${name}" not found`);
            return false;
        }

        this.middleware.delete(name);
        this.updateExecutionOrder();

        console.log(`[StateMiddleware] Unregistered middleware "${name}"`);
        return true;
    }

    /** Updates execution order from registered priorities. */
    public updateExecutionOrder(): void {
        this.executionOrder = [...this.middleware.keys()].sort((a, b) => {
            const priorityA = this.middleware.get(a)?.priority ?? 100;
            const priorityB = this.middleware.get(b)?.priority ?? 100;
            return priorityA - priorityB;
        });
    }

    /** Wraps a phase handler with logging, timing, and error propagation. */
    public wrapHandler(
        middlewareName: string,
        phase: MiddlewareHandlerPhase,
        handler: MiddlewarePhaseHandler
    ): MiddlewarePhaseHandler {
        return async (context) => {
            const runtime = stateMiddlewareRuntime();
            const startTime = runtime.performanceNow();

            try {
                try {
                    return await handler(context);
                } finally {
                    const duration = runtime.performanceNow() - startTime;
                    if (duration > 5) {
                        console.warn(
                            `[StateMiddleware] Slow middleware "${middlewareName}.${phase}": ${duration.toFixed(2)}ms`
                        );
                    }
                }
            } catch (error) {
                const err = toError(error);
                console.error(
                    `[StateMiddleware] Handler error in "${middlewareName}.${phase}":`,
                    err
                );
                throw err;
            }
        };
    }
}

/** Global middleware manager. */
export const middlewareManager = new StateMiddlewareManager();

/** Logs state operations for debugging. */
export const loggingMiddleware: MiddlewareDefinition = {
    afterSet(context) {
        if (context.options?.["source"] !== "internal") {
            console.log(`[StateLog] Set "${context.path}" completed`);
        }
        return context;
    },

    beforeSet(context) {
        if (context.options?.["source"] !== "internal") {
            console.log(
                `[StateLog] Setting "${context.path}" to:`,
                context.value
            );
        }
        return context;
    },

    metadata: {
        description: "Logs all state operations for debugging",
        version: "1.0.0",
    },

    onError(error) {
        console.error(`[StateLog] Error:`, error);
    },

    onSubscribe(context) {
        console.log(`[StateLog] New subscription to "${context.path}"`);
        return context;
    },
};

/** Validates state changes before writes. */
export const validationMiddleware: MiddlewareDefinition = {
    beforeSet(context) {
        if (
            context.value === undefined &&
            context.options?.["allowUndefined"] !== true
        ) {
            console.warn(
                `[StateValidation] Preventing undefined value for "${context.path}"`
            );
            return false;
        }

        if (
            context.path === "app.initialized" &&
            typeof context.value !== "boolean"
        ) {
            console.error(
                `[StateValidation] app.initialized must be boolean, got:`,
                typeof context.value
            );
            return false;
        }

        if (
            context.path === "app.startTime" &&
            (typeof context.value !== "number" || context.value <= 0)
        ) {
            console.error(
                `[StateValidation] app.startTime must be positive number, got:`,
                context.value
            );
            return false;
        }

        return context;
    },

    metadata: {
        description: "Validates state changes according to defined schemas",
        version: "1.0.0",
    },

    onError(error) {
        void showNotification(
            `State validation error: ${error.message}`,
            "error"
        );
    },
};

/** Monitors state operation performance. */
export const performanceMiddleware: MiddlewareDefinition = {
    afterSet(context) {
        if (context._startTime) {
            const runtime = stateMiddlewareRuntime();
            const duration = runtime.performanceNow() - context._startTime;

            if (duration > 10) {
                console.warn(
                    `[StatePerf] Slow state operation "${context.path}": ${duration.toFixed(2)}ms`
                );
            }

            statePerformanceHistory.push({
                duration,
                path: context.path,
                timestamp: runtime.dateNow(),
            });

            if (statePerformanceHistory.length > 100) {
                statePerformanceHistory.shift();
            }
        }

        return context;
    },

    beforeSet(context) {
        context._startTime = stateMiddlewareRuntime().performanceNow();
        return context;
    },

    metadata: {
        description: "Monitors state operation performance",
        version: "1.0.0",
    },
};

/** Persists selected state paths to localStorage. */
export const persistenceMiddleware: MiddlewareDefinition = {
    afterSet(context) {
        const persistPaths = [
            "settings.theme",
            "settings.mapTheme",
            "ui.activeTab",
            "app.windowState",
        ];

        if (persistPaths.some((path) => context.path.startsWith(path))) {
            try {
                const key = `ffv_state_${context.path.replaceAll(".", "_")}`;
                const didPersist = stateStorageRuntime().setItem(
                    key,
                    JSON.stringify(context.value)
                );
                if (!didPersist) {
                    return context;
                }

                console.log(
                    `[StatePersist] Saved "${context.path}" to localStorage`
                );
            } catch (error) {
                console.error(
                    `[StatePersist] Failed to save "${context.path}":`,
                    error
                );
            }
        }

        return context;
    },

    metadata: {
        description:
            "Automatically persists certain state values to localStorage",
        version: "1.0.0",
    },
};

/** Shows notifications for important state changes. */
export const notificationMiddleware: MiddlewareDefinition = {
    afterSet(context) {
        if (
            context.path === "fitFile.rawData" &&
            isRecord(context.value) &&
            Object.keys(context.value).length > 0
        ) {
            void showNotification("FIT file loaded successfully", "success");
        }

        if (context.path === "app.initialized" && context.value === true) {
            void showNotification("Application initialized", "success");
        }

        if (context.path === "system.error" && context.value) {
            void showNotification(
                `System error: ${getMessage(context.value)}`,
                "error"
            );
        }

        return context;
    },

    metadata: {
        description: "Shows notifications for important state changes",
        version: "1.0.0",
    },
};

/** Cleans up the middleware system. */
export function cleanupMiddleware(): void {
    middlewareManager.clear();
    console.log("[StateMiddleware] Middleware system cleaned up");
}

/** Enables or disables middleware by name. */
export function enableMiddleware(name: string, enabled = true): boolean {
    return middlewareManager.setEnabled(name, enabled);
}

/** Executes middleware for a phase. */
export function executeMiddleware(
    phase: MiddlewarePhase | string,
    context: MiddlewareContext
): Promise<MiddlewareContext> {
    return middlewareManager.execute(phase, context);
}

/** Gets registered middleware diagnostics. */
export function getMiddlewareInfo(): MiddlewareInfo[] {
    return middlewareManager.getMiddlewareInfo();
}

let defaultMiddlewareInitialized = false;

/** Initializes default middleware once. */
export function initializeDefaultMiddleware(): void {
    if (defaultMiddlewareInitialized) {
        console.log(
            "[StateMiddleware] Default middleware already initialized, skipping..."
        );
        return;
    }

    console.log("[StateMiddleware] Initializing default middleware...");

    middlewareManager.register("validation", validationMiddleware, 10);
    middlewareManager.register("logging", loggingMiddleware, 20);
    middlewareManager.register("performance", performanceMiddleware, 30);
    middlewareManager.register("persistence", persistenceMiddleware, 40);
    middlewareManager.register("notification", notificationMiddleware, 50);

    defaultMiddlewareInitialized = true;
    console.log("[StateMiddleware] Default middleware initialized");
}

/** Registers custom middleware. */
export function registerMiddleware(
    name: string,
    middleware: MiddlewareDefinition,
    priority = 100
): void {
    middlewareManager.register(name, middleware, priority);
}

/** Unregisters custom middleware. */
export function unregisterMiddleware(name: string): boolean {
    return middlewareManager.unregister(name);
}
