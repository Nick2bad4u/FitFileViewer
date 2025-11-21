/**
 * @fileoverview Unified Resource Cleanup Manager
 * @description Centralized manager for all application resources including charts, maps, event listeners, timers, and more
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

import { cleanupEventListeners } from "../../ui/events/eventListenerManager.js";

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
class ResourceManager {
    constructor() {
        /** @type {Map<string, Resource>} */
        this.resources = new Map();

        /** @type {number} */
        this.nextId = 1;

        /** @type {boolean} */
        this.isShuttingDown = false;

        /** @type {Set<Function>} */
        this.shutdownHooks = new Set();

        // Bind methods to preserve context
        this.register = this.register.bind(this);
        this.unregister = this.unregister.bind(this);
        this.cleanup = this.cleanup.bind(this);
        this.cleanupAll = this.cleanupAll.bind(this);
        this.getStats = this.getStats.bind(this);
    }

    /**
     * Add a shutdown hook to be called during application shutdown
     * @param {Function} hook - Function to call during shutdown
     */
    addShutdownHook(hook) {
        if (typeof hook === "function") {
            this.shutdownHooks.add(hook);
        }
    }

    /**
     * Cleanup resources by filter criteria
     * @param {Object} filter - Filter criteria
     * @param {ResourceType} [filter.type] - Resource type to cleanup
     * @param {string} [filter.owner] - Owner to cleanup resources for
     * @returns {number} Number of resources cleaned up
     */
    cleanup(filter = {}) {
        let cleanedCount = 0;

        for (const [id, resource] of this.resources.entries()) {
            let shouldCleanup = true;

            if (filter.type && resource.type !== filter.type) {
                shouldCleanup = false;
            }

            if (filter.owner && resource.owner !== filter.owner) {
                shouldCleanup = false;
            }

            if (shouldCleanup) {
                try {
                    resource.cleanup();
                    this.resources.delete(id);
                    cleanedCount++;
                    console.log(`[ResourceManager] Cleaned up ${resource.type} resource: ${id}`);
                } catch (error) {
                    console.error(`[ResourceManager] Error cleaning up resource ${id}:`, error);
                }
            }
        }

        console.log(`[ResourceManager] Cleanup complete: ${cleanedCount} resources cleaned`, filter);
        return cleanedCount;
    }

    /**
     * Cleanup all registered resources
     * @returns {number} Number of resources cleaned up
     */
    cleanupAll() {
        const count = this.resources.size;
        console.log(`[ResourceManager] Cleaning up all ${count} resources...`);

        // Cleanup in reverse order of registration (LIFO - Last In First Out)
        const resources = Array.from(this.resources.entries()).toReversed();

        for (const [id, resource] of resources) {
            try {
                resource.cleanup();
                console.log(`[ResourceManager] Cleaned up ${resource.type} resource: ${id}`);
            } catch (error) {
                console.error(`[ResourceManager] Error cleaning up resource ${id}:`, error);
            }
        }

        this.resources.clear();

        // Also cleanup event listeners managed by eventListenerManager
        try {
            cleanupEventListeners();
        } catch (error) {
            console.error("[ResourceManager] Error cleaning up event listeners:", error);
        }

        console.log(`[ResourceManager] Cleanup complete: ${count} resources cleaned`);
        return count;
    }

    /**
     * Get statistics about registered resources
     * @returns {ResourceStats} Resource statistics
     */
    getStats() {
        /** @type {ResourceStats} */
        const stats = {
            byOwner: {},
            byType: {
                chart: 0,
                eventListener: 0,
                interval: 0,
                map: 0,
                observer: 0,
                other: 0,
                timer: 0,
                worker: 0,
            },
            total: this.resources.size,
        };

        for (const resource of this.resources.values()) {
            // Count by type
            stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;

            // Count by owner
            if (resource.owner) {
                stats.byOwner[resource.owner] = (stats.byOwner[resource.owner] || 0) + 1;
            }
        }

        return stats;
    }

    /**
     * Get a list of all registered resources (for debugging)
     * @returns {Array<{id: string, type: ResourceType, owner?: string}>}
     */
    list() {
        return Array.from(this.resources.values()).map((resource) => ({
            id: resource.id,
            owner: resource.owner,
            timestamp: resource.timestamp,
            type: resource.type,
        }));
    }

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
    register(type, cleanup, options = {}) {
        if (typeof cleanup !== "function") {
            console.warn("[ResourceManager] Cleanup must be a function");
            return "";
        }

        const id = options.id || `resource-${type}-${this.nextId++}`;

        /** @type {Resource} */
        const resource = {
            cleanup,
            id,
            instance: options.instance,
            owner: options.owner,
            timestamp: Date.now(),
            type,
        };

        this.resources.set(id, resource);

        console.log(`[ResourceManager] Registered ${type} resource: ${id}`, {
            owner: options.owner,
            total: this.resources.size,
        });

        return id;
    }

    /**
     * Register a chart for automatic cleanup
     * @param {any} chart - ChartJS instance
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerChart(chart, options = {}) {
        if (!chart || typeof chart.destroy !== "function") {
            console.warn("[ResourceManager] Invalid chart instance");
            return "";
        }

        return this.register(
            "chart",
            () => {
                try {
                    chart.destroy();
                } catch (error) {
                    console.error("[ResourceManager] Error destroying chart:", error);
                }
            },
            { ...options, instance: chart }
        );
    }

    /**
     * Register an interval for automatic cleanup
     * @param {number} intervalId - Interval ID from setInterval
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerInterval(intervalId, options = {}) {
        return this.register(
            "interval",
            () => {
                clearInterval(intervalId);
            },
            { ...options, instance: intervalId }
        );
    }

    /**
     * Register a map for automatic cleanup
     * @param {any} map - Leaflet map instance
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerMap(map, options = {}) {
        if (!map || typeof map.remove !== "function") {
            console.warn("[ResourceManager] Invalid map instance");
            return "";
        }

        return this.register(
            "map",
            () => {
                try {
                    map.remove();
                } catch (error) {
                    console.error("[ResourceManager] Error removing map:", error);
                }
            },
            { ...options, instance: map }
        );
    }

    /**
     * Register an observer for automatic cleanup
     * @param {any} observer - Observer instance (MutationObserver, IntersectionObserver, etc.)
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerObserver(observer, options = {}) {
        if (!observer || typeof observer.disconnect !== "function") {
            console.warn("[ResourceManager] Invalid observer instance");
            return "";
        }

        return this.register(
            "observer",
            () => {
                try {
                    observer.disconnect();
                } catch (error) {
                    console.error("[ResourceManager] Error disconnecting observer:", error);
                }
            },
            { ...options, instance: observer }
        );
    }

    /**
     * Register a timer for automatic cleanup
     * @param {number} timerId - Timer ID from setTimeout
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerTimer(timerId, options = {}) {
        return this.register(
            "timer",
            () => {
                clearTimeout(timerId);
            },
            { ...options, instance: timerId }
        );
    }

    /**
     * Register a web worker for automatic cleanup
     * @param {Worker} worker - Web Worker instance
     * @param {Object} [options] - Optional configuration
     * @param {string} [options.owner] - Owner/component identifier
     * @param {string} [options.id] - Custom ID
     * @returns {string} Resource ID
     */
    registerWorker(worker, options = {}) {
        if (!worker || typeof worker.terminate !== "function") {
            console.warn("[ResourceManager] Invalid worker instance");
            return "";
        }

        return this.register(
            "worker",
            () => {
                try {
                    worker.terminate();
                } catch (error) {
                    console.error("[ResourceManager] Error terminating worker:", error);
                }
            },
            { ...options, instance: worker }
        );
    }

    /**
     * Remove a shutdown hook
     * @param {Function} hook - Function to remove
     */
    removeShutdownHook(hook) {
        this.shutdownHooks.delete(hook);
    }

    /**
     * Execute shutdown sequence
     * @returns {Promise<void>}
     */
    async shutdown() {
        if (this.isShuttingDown) {
            console.log("[ResourceManager] Shutdown already in progress");
            return;
        }

        this.isShuttingDown = true;
        console.log("[ResourceManager] Beginning shutdown sequence...");

        // Execute shutdown hooks first
        await Promise.all(
            Array.from(this.shutdownHooks).map(async (hook) => {
                try {
                    await hook();
                } catch (error) {
                    console.error("[ResourceManager] Error in shutdown hook:", error);
                }
            })
        );

        // Cleanup all resources
        this.cleanupAll();

        console.log("[ResourceManager] Shutdown complete");
    }

    /**
     * Unregister and cleanup a specific resource
     * @param {string} id - Resource ID to cleanup
     * @returns {boolean} True if resource was found and cleaned up
     */
    unregister(id) {
        const resource = this.resources.get(id);
        if (!resource) {
            return false;
        }

        try {
            resource.cleanup();
            console.log(`[ResourceManager] Cleaned up ${resource.type} resource: ${id}`);
        } catch (error) {
            console.error(`[ResourceManager] Error cleaning up resource ${id}:`, error);
        }

        this.resources.delete(id);
        return true;
    }
}

// Create singleton instance
const resourceManager = new ResourceManager();

// Setup window cleanup handler (only when addEventListener is available)
if (globalThis.window !== undefined && typeof globalThis.window.addEventListener === "function") {
    globalThis.window.addEventListener("beforeunload", () => {
        console.log("[ResourceManager] Window unload detected, cleaning up resources...");
        resourceManager.cleanupAll();
    });
}

// Export singleton instance and individual methods
export { resourceManager };
export const {
    addShutdownHook,
    cleanup,
    cleanupAll,
    getStats,
    list,
    register,
    registerChart,
    registerInterval,
    registerMap,
    registerObserver,
    registerTimer,
    registerWorker,
    shutdown,
    unregister,
} = resourceManager;

// Make available globally for debugging
if (typeof globalThis !== "undefined") {
    /** @type {any} */ (globalThis).resourceManager = resourceManager;
}
