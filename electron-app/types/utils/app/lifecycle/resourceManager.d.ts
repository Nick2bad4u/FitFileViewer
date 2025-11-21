/**
 * Add a shutdown hook to be called during application shutdown
 * @param {Function} hook - Function to call during shutdown
 */
export function addShutdownHook(hook: Function): void;
/**
 * Cleanup resources by filter criteria
 * @param {Object} filter - Filter criteria
 * @param {ResourceType} [filter.type] - Resource type to cleanup
 * @param {string} [filter.owner] - Owner to cleanup resources for
 * @returns {number} Number of resources cleaned up
 */
export function cleanup(filter?: { type?: ResourceType | undefined; owner?: string | undefined }): number;
/**
 * Cleanup all registered resources
 * @returns {number} Number of resources cleaned up
 */
export function cleanupAll(): number;
/**
 * Get statistics about registered resources
 * @returns {ResourceStats} Resource statistics
 */
export function getStats(): ResourceStats;
/**
 * Get a list of all registered resources (for debugging)
 * @returns {Array<{id: string, type: ResourceType, owner?: string}>}
 */
export function list(): Array<{
    id: string;
    type: ResourceType;
    owner?: string;
}>;
/**
 * Register a new resource for automatic cleanup
 * @param {ResourceType} type - Type of resource
 * @param {Function} cleanup - Cleanup function to call when resource is released
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.owner] - Owner/component identifier
 * @param {any} [options.instance] - Reference to the resource instance
 * @param {string} [options.id] - Custom ID (auto-generated if not provided)
 * @returns {string} Resource ID for later cleanup
 */
export function register(
    type: ResourceType,
    cleanup: Function,
    options?: {
        owner?: string | undefined;
        instance?: any;
        id?: string | undefined;
    }
): string;
/**
 * Register a chart for automatic cleanup
 * @param {any} chart - ChartJS instance
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.owner] - Owner/component identifier
 * @param {string} [options.id] - Custom ID
 * @returns {string} Resource ID
 */
export function registerChart(
    chart: any,
    options?: {
        owner?: string | undefined;
        id?: string | undefined;
    }
): string;
/**
 * Register an interval for automatic cleanup
 * @param {number} intervalId - Interval ID from setInterval
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.owner] - Owner/component identifier
 * @param {string} [options.id] - Custom ID
 * @returns {string} Resource ID
 */
export function registerInterval(
    intervalId: number,
    options?: {
        owner?: string | undefined;
        id?: string | undefined;
    }
): string;
/**
 * Register a map for automatic cleanup
 * @param {any} map - Leaflet map instance
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.owner] - Owner/component identifier
 * @param {string} [options.id] - Custom ID
 * @returns {string} Resource ID
 */
export function registerMap(
    map: any,
    options?: {
        owner?: string | undefined;
        id?: string | undefined;
    }
): string;
/**
 * Register an observer for automatic cleanup
 * @param {any} observer - Observer instance (MutationObserver, IntersectionObserver, etc.)
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.owner] - Owner/component identifier
 * @param {string} [options.id] - Custom ID
 * @returns {string} Resource ID
 */
export function registerObserver(
    observer: any,
    options?: {
        owner?: string | undefined;
        id?: string | undefined;
    }
): string;
/**
 * Register a timer for automatic cleanup
 * @param {number} timerId - Timer ID from setTimeout
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.owner] - Owner/component identifier
 * @param {string} [options.id] - Custom ID
 * @returns {string} Resource ID
 */
export function registerTimer(
    timerId: number,
    options?: {
        owner?: string | undefined;
        id?: string | undefined;
    }
): string;
/**
 * Register a web worker for automatic cleanup
 * @param {Worker} worker - Web Worker instance
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.owner] - Owner/component identifier
 * @param {string} [options.id] - Custom ID
 * @returns {string} Resource ID
 */
export function registerWorker(
    worker: Worker,
    options?: {
        owner?: string | undefined;
        id?: string | undefined;
    }
): string;
/**
 * Execute shutdown sequence
 * @returns {Promise<void>}
 */
export function shutdown(): Promise<void>;
/**
 * Unregister and cleanup a specific resource
 * @param {string} id - Resource ID to cleanup
 * @returns {boolean} True if resource was found and cleaned up
 */
export function unregister(id: string): boolean;
export type ResourceType = "chart" | "map" | "timer" | "interval" | "observer" | "worker" | "eventListener" | "other";
export type Resource = {
    /**
     * - Unique resource identifier
     */
    id: string;
    /**
     * - Type of resource
     */
    type: ResourceType;
    /**
     * - Optional owner/component identifier
     */
    owner?: string;
    /**
     * - Cleanup function for this resource
     */
    cleanup: Function;
    /**
     * - Optional reference to the resource instance
     */
    instance?: any;
    /**
     * - When the resource was registered
     */
    timestamp: number;
};
export type ResourceStats = {
    /**
     * - Total number of resources
     */
    total: number;
    /**
     * - Count of resources by type
     */
    byType: any;
    /**
     * - Count of resources by owner
     */
    byOwner: {
        [x: string]: number;
    };
};
export const resourceManager: ResourceManager;
/**
 * @typedef {'chart' | 'map' | 'timer' | 'interval' | 'observer' | 'worker' | 'eventListener' | 'other'} ResourceType
 */
/**
 * @typedef {Object} Resource
 * @property {string} id - Unique resource identifier
 * @property {ResourceType} type - Type of resource
 * @property {string} [owner] - Optional owner/component identifier
 * @property {Function} cleanup - Cleanup function for this resource
 * @property {any} [instance] - Optional reference to the resource instance
 * @property {number} timestamp - When the resource was registered
 */
/**
 * @typedef {Object} ResourceStats
 * @property {number} total - Total number of resources
 * @property {Object.<ResourceType, number>} byType - Count of resources by type
 * @property {Object.<string, number>} byOwner - Count of resources by owner
 */
/**
 * Centralized resource manager for the application
 * Tracks and cleans up all resources including charts, maps, event listeners, timers, etc.
 */
declare class ResourceManager {
    /** @type {Map<string, Resource>} */
    resources: Map<string, Resource>;
    /** @type {number} */
    nextId: number;
    /** @type {boolean} */
    isShuttingDown: boolean;
    /** @type {Set<Function>} */
    shutdownHooks: Set<Function>;
    /**
     * Register a new resource for automatic cleanup
     * @param {ResourceType} type - Type of resource
     * @param {Function} cleanup - Cleanup function to call when resource is released
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {any} [options.instance] - Reference to the resource instance
     * @param {string} [options.id] - Custom ID (auto-generated if not provided)
     * @returns {string} Resource ID for later cleanup
     */
    register(
        type: ResourceType,
        cleanup: Function,
        options?: {
            owner?: string | undefined;
            instance?: any;
            id?: string | undefined;
        }
    ): string;
    /**
     * Unregister and cleanup a specific resource
     * @param {string} id - Resource ID to cleanup
     * @returns {boolean} True if resource was found and cleaned up
     */
    unregister(id: string): boolean;
    /**
     * Cleanup resources by filter criteria
     * @param {Object} filter - Filter criteria
     * @param {ResourceType} [filter.type] - Resource type to cleanup
     * @param {string} [filter.owner] - Owner to cleanup resources for
     * @returns {number} Number of resources cleaned up
     */
    cleanup(filter?: { type?: ResourceType | undefined; owner?: string | undefined }): number;
    /**
     * Cleanup all registered resources
     * @returns {number} Number of resources cleaned up
     */
    cleanupAll(): number;
    /**
     * Get statistics about registered resources
     * @returns {ResourceStats} Resource statistics
     */
    getStats(): ResourceStats;
    /**
     * Add a shutdown hook to be called during application shutdown
     * @param {Function} hook - Function to call during shutdown
     */
    addShutdownHook(hook: Function): void;
    /**
     * Get a list of all registered resources (for debugging)
     * @returns {Array<{id: string, type: ResourceType, owner?: string}>}
     */
    list(): Array<{
        id: string;
        type: ResourceType;
        owner?: string;
    }>;
    /**
     * Register a chart for automatic cleanup
     * @param {any} chart - ChartJS instance
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerChart(
        chart: any,
        options?: {
            owner?: string | undefined;
            id?: string | undefined;
        }
    ): string;
    /**
     * Register an interval for automatic cleanup
     * @param {number} intervalId - Interval ID from setInterval
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerInterval(
        intervalId: number,
        options?: {
            owner?: string | undefined;
            id?: string | undefined;
        }
    ): string;
    /**
     * Register a map for automatic cleanup
     * @param {any} map - Leaflet map instance
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerMap(
        map: any,
        options?: {
            owner?: string | undefined;
            id?: string | undefined;
        }
    ): string;
    /**
     * Register an observer for automatic cleanup
     * @param {any} observer - Observer instance (MutationObserver, IntersectionObserver, etc.)
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerObserver(
        observer: any,
        options?: {
            owner?: string | undefined;
            id?: string | undefined;
        }
    ): string;
    /**
     * Register a timer for automatic cleanup
     * @param {number} timerId - Timer ID from setTimeout
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerTimer(
        timerId: number,
        options?: {
            owner?: string | undefined;
            id?: string | undefined;
        }
    ): string;
    /**
     * Register a web worker for automatic cleanup
     * @param {Worker} worker - Web Worker instance
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerWorker(
        worker: Worker,
        options?: {
            owner?: string | undefined;
            id?: string | undefined;
        }
    ): string;
    /**
     * Remove a shutdown hook
     * @param {Function} hook - Function to remove
     */
    removeShutdownHook(hook: Function): void;
    /**
     * Execute shutdown sequence
     * @returns {Promise<void>}
     */
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=resourceManager.d.ts.map
