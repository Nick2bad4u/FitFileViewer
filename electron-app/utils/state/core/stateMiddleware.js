/**
 * State Middleware System
 * Provides middleware support for state operations, enabling plugins and custom behaviors
 */

import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * Middleware execution order
 */
const MIDDLEWARE_PHASES = {
    BEFORE_SET: "beforeSet",
    AFTER_SET: "afterSet",
    BEFORE_GET: "beforeGet",
    AFTER_GET: "afterGet",
    ON_SUBSCRIBE: "onSubscribe",
    ON_UNSUBSCRIBE: "onUnsubscribe",
    ON_ERROR: "onError",
};

/**
 * State Middleware Manager Class
 */
class StateMiddlewareManager {
    constructor() {
        this.middleware = new Map();
        this.isEnabled = true;
        this.executionOrder = [];
    }

    /**
     * Register middleware
     * @param {string} name - Middleware name
     * @param {Object} middleware - Middleware object with phase handlers
     * @param {number} priority - Execution priority (lower = earlier, default: 100)
     */
    register(name, middleware, priority = 100) {
        if (this.middleware.has(name)) {
            console.warn(`[StateMiddleware] Middleware "${name}" already registered, replacing...`);
        }

        const wrappedMiddleware = {
            name,
            priority,
            handlers: {},
            isEnabled: true,
            metadata: middleware.metadata || {},
        };

        // Wrap each phase handler with error handling
        Object.values(MIDDLEWARE_PHASES).forEach((phase) => {
            if (middleware[phase] && typeof middleware[phase] === "function") {
                wrappedMiddleware.handlers[phase] = this.wrapHandler(name, phase, middleware[phase]);
            }
        });

        this.middleware.set(name, wrappedMiddleware);
        this.updateExecutionOrder();

        console.log(`[StateMiddleware] Registered middleware "${name}" with priority ${priority}`);
    }

    /**
     * Unregister middleware
     * @param {string} name - Middleware name
     */
    unregister(name) {
        if (!this.middleware.has(name)) {
            console.warn(`[StateMiddleware] Middleware "${name}" not found`);
            return false;
        }

        this.middleware.delete(name);
        this.updateExecutionOrder();

        console.log(`[StateMiddleware] Unregistered middleware "${name}"`);
        return true;
    }

    /**
     * Enable/disable specific middleware
     * @param {string} name - Middleware name
     * @param {boolean} enabled - Whether to enable the middleware
     */
    setEnabled(name, enabled) {
        const middleware = this.middleware.get(name);
        if (!middleware) {
            console.warn(`[StateMiddleware] Middleware "${name}" not found`);
            return false;
        }

        middleware.isEnabled = enabled;
        console.log(`[StateMiddleware] Middleware "${name}" ${enabled ? "enabled" : "disabled"}`);
        return true;
    }

    /**
     * Enable/disable all middleware
     * @param {boolean} enabled - Whether to enable middleware system
     */
    setGlobalEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`[StateMiddleware] Middleware system ${enabled ? "enabled" : "disabled"}`);
    }

    /**
     * Execute middleware for a specific phase
     * @param {string} phase - Middleware phase
     * @param {Object} context - Context object for the operation
     * @returns {Promise<Object>} Modified context
     */
    async execute(phase, context) {
        if (!this.isEnabled) return context;

        let currentContext = { ...context };

        for (const middlewareName of this.executionOrder) {
            const middleware = this.middleware.get(middlewareName);

            if (!middleware || !middleware.isEnabled) continue;

            const handler = middleware.handlers[phase];
            if (!handler) continue;

            try {
                const result = await handler(currentContext);

                // If handler returns an object, use it as new context
                if (result && typeof result === "object") {
                    currentContext = result;
                }

                // If handler explicitly returns false, stop execution
                if (result === false) {
                    console.log(`[StateMiddleware] Execution stopped by middleware "${middlewareName}"`);
                    break;
                }
            } catch (error) {
                console.error(`[StateMiddleware] Error in middleware "${middlewareName}" phase "${phase}":`, error);

                // Execute error handlers
                await this.executeErrorHandlers(error, {
                    middleware: middlewareName,
                    phase,
                    context: currentContext,
                });
            }
        }

        return currentContext;
    }

    /**
     * Execute error handlers
     * @param {Error} error - Error that occurred
     * @param {Object} errorContext - Error context
     */
    async executeErrorHandlers(error, errorContext) {
        for (const middlewareName of this.executionOrder) {
            const middleware = this.middleware.get(middlewareName);

            if (!middleware || !middleware.isEnabled) continue;

            const errorHandler = middleware.handlers[MIDDLEWARE_PHASES.ON_ERROR];
            if (!errorHandler) continue;

            try {
                await errorHandler(error, errorContext);
            } catch (handlerError) {
                console.error(`[StateMiddleware] Error in error handler for "${middlewareName}":`, handlerError);
            }
        }
    }

    /**
     * Wrap middleware handler with error handling and timing
     * @param {string} middlewareName - Name of middleware
     * @param {string} phase - Phase name
     * @param {Function} handler - Original handler
     * @returns {Function} Wrapped handler
     */
    wrapHandler(middlewareName, phase, handler) {
        return async (context) => {
            const startTime = performance.now();

            try {
                const result = await handler(context);

                const duration = performance.now() - startTime;
                if (duration > 5) {
                    console.warn(
                        `[StateMiddleware] Slow middleware "${middlewareName}.${phase}": ${duration.toFixed(2)}ms`
                    );
                }

                return result;
            } catch (error) {
                console.error(`[StateMiddleware] Handler error in "${middlewareName}.${phase}":`, error);
                throw error;
            }
        };
    }

    /**
     * Update execution order based on priorities
     */
    updateExecutionOrder() {
        this.executionOrder = Array.from(this.middleware.keys()).sort((a, b) => {
            const priorityA = this.middleware.get(a).priority;
            const priorityB = this.middleware.get(b).priority;
            return priorityA - priorityB;
        });
    }

    /**
     * Get middleware information
     * @returns {Array} List of registered middleware with metadata
     */
    getMiddlewareInfo() {
        return Array.from(this.middleware.values()).map((middleware) => ({
            name: middleware.name,
            priority: middleware.priority,
            isEnabled: middleware.isEnabled,
            phases: Object.keys(middleware.handlers),
            metadata: middleware.metadata,
        }));
    }

    /**
     * Clear all middleware
     */
    clear() {
        this.middleware.clear();
        this.executionOrder = [];
        console.log("[StateMiddleware] All middleware cleared");
    }
}

// Create global middleware manager
export const middlewareManager = new StateMiddlewareManager();

/**
 * Built-in middleware implementations
 */

/**
 * Logging middleware - logs all state operations
 */
export const loggingMiddleware = {
    metadata: {
        description: "Logs all state operations for debugging",
        version: "1.0.0",
    },

    beforeSet(context) {
        if (context.options?.source !== "internal") {
            console.log(`[StateLog] Setting "${context.path}" to:`, context.value);
        }
        return context;
    },

    afterSet(context) {
        if (context.options?.source !== "internal") {
            console.log(`[StateLog] Set "${context.path}" completed`);
        }
        return context;
    },

    onSubscribe(context) {
        console.log(`[StateLog] New subscription to "${context.path}"`);
        return context;
    },
    onError(error) {
        console.error(`[StateLog] Error:`, error);
    },
};

/**
 * Validation middleware - validates state changes
 */
export const validationMiddleware = {
    metadata: {
        description: "Validates state changes according to defined schemas",
        version: "1.0.0",
    },

    beforeSet(context) {
        // Prevent setting undefined values
        if (context.value === undefined && !context.options?.allowUndefined) {
            console.warn(`[StateValidation] Preventing undefined value for "${context.path}"`);
            return false; // Stop execution
        }

        // Validate specific paths
        if (context.path === "app.initialized" && typeof context.value !== "boolean") {
            console.error(`[StateValidation] app.initialized must be boolean, got:`, typeof context.value);
            return false;
        }

        if (context.path === "app.startTime" && (typeof context.value !== "number" || context.value <= 0)) {
            console.error(`[StateValidation] app.startTime must be positive number, got:`, context.value);
            return false;
        }

        return context;
    },
    onError(error) {
        showNotification(`State validation error: ${error.message}`, "error");
    },
};

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = {
    metadata: {
        description: "Monitors state operation performance",
        version: "1.0.0",
    },

    beforeSet(context) {
        context._startTime = performance.now();
        return context;
    },

    afterSet(context) {
        if (context._startTime) {
            const duration = performance.now() - context._startTime;

            if (duration > 10) {
                console.warn(`[StatePerf] Slow state operation "${context.path}": ${duration.toFixed(2)}ms`);
            }

            // Store performance data
            if (!window._statePerformance) {
                window._statePerformance = [];
            }

            window._statePerformance.push({
                path: context.path,
                duration,
                timestamp: Date.now(),
            });

            // Keep only recent data
            if (window._statePerformance.length > 100) {
                window._statePerformance.shift();
            }
        }

        return context;
    },
};

/**
 * Persistence middleware - automatically saves certain state to localStorage
 */
export const persistenceMiddleware = {
    metadata: {
        description: "Automatically persists certain state values to localStorage",
        version: "1.0.0",
    },

    afterSet(context) {
        // Define which paths should be persisted
        const persistPaths = ["settings.theme", "settings.mapTheme", "ui.activeTab", "app.windowState"];

        if (persistPaths.some((path) => context.path.startsWith(path))) {
            try {
                const key = `ffv_state_${context.path.replace(/\./g, "_")}`;
                localStorage.setItem(key, JSON.stringify(context.value));
                console.log(`[StatePersist] Saved "${context.path}" to localStorage`);
            } catch (error) {
                console.error(`[StatePersist] Failed to save "${context.path}":`, error);
            }
        }

        return context;
    },
};

/**
 * Notification middleware - shows notifications for important state changes
 */
export const notificationMiddleware = {
    metadata: {
        description: "Shows notifications for important state changes",
        version: "1.0.0",
    },

    afterSet(context) {
        // Show notifications for specific state changes
        if (context.path === "globalData" && context.value && Object.keys(context.value).length > 0) {
            showNotification("FIT file loaded successfully", "success");
        }

        if (context.path === "app.initialized" && context.value === true) {
            showNotification("Application initialized", "success");
        }

        if (context.path === "system.error" && context.value) {
            showNotification(`System error: ${context.value.message}`, "error");
        }

        return context;
    },
};

/**
 * Initialize default middleware
 */
export function initializeDefaultMiddleware() {
    console.log("[StateMiddleware] Initializing default middleware...");

    // Register middleware in priority order
    middlewareManager.register("validation", validationMiddleware, 10); // Highest priority
    middlewareManager.register("logging", loggingMiddleware, 20);
    middlewareManager.register("performance", performanceMiddleware, 30);
    middlewareManager.register("persistence", persistenceMiddleware, 40);
    middlewareManager.register("notification", notificationMiddleware, 50); // Lowest priority

    console.log("[StateMiddleware] Default middleware initialized");
}

/**
 * Cleanup middleware system
 */
export function cleanupMiddleware() {
    middlewareManager.clear();
    console.log("[StateMiddleware] Middleware system cleaned up");
}

/**
 * Convenience functions for middleware registration
 */
export function registerMiddleware(name, middleware, priority = 100) {
    return middlewareManager.register(name, middleware, priority);
}

export function unregisterMiddleware(name) {
    return middlewareManager.unregister(name);
}

export function enableMiddleware(name, enabled = true) {
    return middlewareManager.setEnabled(name, enabled);
}

export function executeMiddleware(phase, context) {
    return middlewareManager.execute(phase, context);
}

export function getMiddlewareInfo() {
    return middlewareManager.getMiddlewareInfo();
}

// Export phases for use by other modules
export { MIDDLEWARE_PHASES };
