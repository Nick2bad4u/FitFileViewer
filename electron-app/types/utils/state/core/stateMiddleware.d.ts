/**
 * Cleanup middleware system
 */
export function cleanupMiddleware(): void;
/**
 * @param {string} name
 * @param {boolean} [enabled=true]
 */
export function enableMiddleware(name: string, enabled?: boolean): boolean;
/**
 * @param {string} phase
 * @param {MiddlewareContext} context
 */
export function executeMiddleware(phase: string, context: MiddlewareContext): Promise<MiddlewareContext>;
export function getMiddlewareInfo(): {
    name: string;
    priority: number;
    isEnabled: boolean;
    phases: string[];
    metadata: {
        [x: string]: any;
    };
}[];
/**
 * Initialize default middleware
 */
export function initializeDefaultMiddleware(): void;
/**
 * Convenience functions for middleware registration
 */
/**
 * @param {string} name
 * @param {MiddlewareDefinition} middleware
 * @param {number} [priority=100]
 */
export function registerMiddleware(name: string, middleware: MiddlewareDefinition, priority?: number): void;
/** @param {string} name */
export function unregisterMiddleware(name: string): boolean;
export const middlewareManager: StateMiddlewareManager;
/**
 * Built-in middleware implementations
 */
/**
 * Logging middleware - logs all state operations
 */
/** @type {MiddlewareDefinition} */
export const loggingMiddleware: MiddlewareDefinition;
/**
 * Validation middleware - validates state changes
 */
/** @type {MiddlewareDefinition} */
export const validationMiddleware: MiddlewareDefinition;
/**
 * Performance monitoring middleware
 */
/** @type {MiddlewareDefinition} */
export const performanceMiddleware: MiddlewareDefinition;
/**
 * Persistence middleware - automatically saves certain state to localStorage
 */
/** @type {MiddlewareDefinition} */
export const persistenceMiddleware: MiddlewareDefinition;
/**
 * Notification middleware - shows notifications for important state changes
 */
/** @type {MiddlewareDefinition} */
export const notificationMiddleware: MiddlewareDefinition;
export type MiddlewareContext = {
    /**
     * - State path being operated on
     */
    path: string;
    /**
     * - New value (for set operations)
     */
    value: any;
    /**
     * - Previous value (for set operations)
     */
    oldValue?: any;
    /**
     * - Options passed to the state operation (shape is dynamic)
     */
    options?:
        | {
              [x: string]: any;
          }
        | undefined;
    /**
     * - Internal timing marker
     */
    _startTime?: number;
};
/**
 * A middleware phase handler. It may mutate and return the context, return a new context object,
 * return false to halt further middleware in the chain, or return void to continue.
 */
export type MiddlewarePhaseHandler = (
    context: MiddlewareContext
) => Promise<MiddlewareContext | false | void> | MiddlewareContext | false | void;
export type MiddlewareDefinition = {
    metadata?:
        | {
              [x: string]: any;
          }
        | undefined;
    beforeSet?: MiddlewarePhaseHandler | undefined;
    afterSet?: MiddlewarePhaseHandler | undefined;
    beforeGet?: MiddlewarePhaseHandler | undefined;
    afterGet?: MiddlewarePhaseHandler | undefined;
    onSubscribe?: MiddlewarePhaseHandler | undefined;
    onUnsubscribe?: MiddlewarePhaseHandler | undefined;
    onError?:
        | ((
              error: Error,
              errorContext?: {
                  middleware: string;
                  phase: string;
                  context: MiddlewareContext;
              }
          ) => Promise<void> | void)
        | undefined;
};
export type RegisteredMiddleware = {
    name: string;
    priority: number;
    isEnabled: boolean;
    handlers: {
        [x: string]: MiddlewarePhaseHandler;
    };
    metadata: {
        [x: string]: any;
    };
};
/**
 * State Middleware Manager Class
 */
declare class StateMiddlewareManager {
    /** @type {Map<string, RegisteredMiddleware>} */
    middleware: Map<string, RegisteredMiddleware>;
    /** @type {boolean} */
    isEnabled: boolean;
    /** @type {string[]} */
    executionOrder: string[];
    /**
     * Clear all middleware
     */
    /** @returns {void} */
    clear(): void;
    /**
     * Execute middleware for a specific phase
     * @param {string} phase - Middleware phase
     * @param {Object} context - Context object for the operation
     * @returns {Promise<Object>} Modified context
     */
    /**
     * @param {string} phase
     * @param {MiddlewareContext} context
     * @returns {Promise<MiddlewareContext>}
     */
    execute(phase: string, context: MiddlewareContext): Promise<MiddlewareContext>;
    /**
     * Execute error handlers
     * @param {Error} error - Error that occurred
     * @param {Object} errorContext - Error context
     */
    /**
     * @param {Error} error
     * @param {{middleware: string, phase: string, context: MiddlewareContext}} errorContext
     */
    executeErrorHandlers(
        error: Error,
        errorContext: {
            middleware: string;
            phase: string;
            context: MiddlewareContext;
        }
    ): Promise<void>;
    /**
     * Get middleware information
     * @returns {Array} List of registered middleware with metadata
     */
    /**
     * @returns {{name:string, priority:number, isEnabled:boolean, phases:string[], metadata:Object<string,any>}[]}
     */
    getMiddlewareInfo(): {
        name: string;
        priority: number;
        isEnabled: boolean;
        phases: string[];
        metadata: {
            [x: string]: any;
        };
    }[];
    /**
     * Register middleware
     * @param {string} name - Middleware name
     * @param {Object} middleware - Middleware object with phase handlers
     * @param {number} priority - Execution priority (lower = earlier, default: 100)
     */
    /**
     * @param {string} name
     * @param {MiddlewareDefinition} middleware
     * @param {number} [priority=100]
     */
    register(name: string, middleware: MiddlewareDefinition, priority?: number): void;
    /**
     * Enable/disable specific middleware
     * @param {string} name - Middleware name
     * @param {boolean} enabled - Whether to enable the middleware
     */
    /**
     * @param {string} name
     * @param {boolean} enabled
     * @returns {boolean}
     */
    setEnabled(name: string, enabled: boolean): boolean;
    /**
     * Enable/disable all middleware
     * @param {boolean} enabled - Whether to enable middleware system
     */
    /**
     * @param {boolean} enabled
     * @returns {void}
     */
    setGlobalEnabled(enabled: boolean): void;
    /**
     * Unregister middleware
     * @param {string} name - Middleware name
     */
    /**
     * @param {string} name
     * @returns {boolean}
     */
    unregister(name: string): boolean;
    /**
     * Update execution order based on priorities
     */
    /** @returns {void} */
    updateExecutionOrder(): void;
    /**
     * Wrap middleware handler with error handling and timing
     * @param {string} middlewareName - Name of middleware
     * @param {string} phase - Phase name
     * @param {Function} handler - Original handler
     * @returns {Function} Wrapped handler
     */
    /**
     * @param {string} middlewareName
     * @param {string} phase
     * @param {MiddlewarePhaseHandler} handler
     * @returns {MiddlewarePhaseHandler}
     */
    wrapHandler(middlewareName: string, phase: string, handler: MiddlewarePhaseHandler): MiddlewarePhaseHandler;
}
export namespace MIDDLEWARE_PHASES {
    let AFTER_GET: string;
    let AFTER_SET: string;
    let BEFORE_GET: string;
    let BEFORE_SET: string;
    let ON_ERROR: string;
    let ON_SUBSCRIBE: string;
    let ON_UNSUBSCRIBE: string;
}
export {};
