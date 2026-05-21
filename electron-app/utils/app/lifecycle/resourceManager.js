import { cleanupEventListeners } from "../../ui/events/eventListenerManager.js";
function hasFunctionProperty(value, property) {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof value[property] === "function"
    );
}
function isDestroyableChart(value) {
    return hasFunctionProperty(value, "destroy");
}
function isDisconnectableObserver(value) {
    return hasFunctionProperty(value, "disconnect");
}
function isRemovableMap(value) {
    return hasFunctionProperty(value, "remove");
}
function isTerminableWorker(value) {
    return hasFunctionProperty(value, "terminate");
}
function createResource(type, cleanup, id, options) {
    return {
        cleanup,
        id,
        timestamp: Date.now(),
        type,
        ...(options.owner === undefined ? {} : { owner: options.owner }),
        ...(options.instance === undefined
            ? {}
            : { instance: options.instance }),
    };
}
/**
 * Centralized resource manager for the application Tracks and cleans up all
 * resources including charts, maps, event listeners, timers, etc.
 */
class ResourceManager {
    isShuttingDown = false;
    nextId = 1;
    resources = new Map();
    shutdownHooks = new Set();
    constructor() {
        this.addShutdownHook = this.addShutdownHook.bind(this);
        this.register = this.register.bind(this);
        this.unregister = this.unregister.bind(this);
        this.cleanup = this.cleanup.bind(this);
        this.cleanupAll = this.cleanupAll.bind(this);
        this.getStats = this.getStats.bind(this);
        this.list = this.list.bind(this);
        this.registerChart = this.registerChart.bind(this);
        this.registerInterval = this.registerInterval.bind(this);
        this.registerMap = this.registerMap.bind(this);
        this.registerObserver = this.registerObserver.bind(this);
        this.registerTimer = this.registerTimer.bind(this);
        this.registerWorker = this.registerWorker.bind(this);
        this.shutdown = this.shutdown.bind(this);
    }
    /**
     * Add a shutdown hook to be called during application shutdown
     */
    addShutdownHook(hook) {
        if (typeof hook === "function") {
            this.shutdownHooks.add(hook);
        }
    }
    /**
     * Cleanup resources by filter criteria
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
                    console.log(
                        `[ResourceManager] Cleaned up ${resource.type} resource: ${id}`
                    );
                } catch (error) {
                    console.error(
                        `[ResourceManager] Error cleaning up resource ${id}:`,
                        error
                    );
                }
            }
        }
        console.log(
            `[ResourceManager] Cleanup complete: ${cleanedCount} resources cleaned`,
            filter
        );
        return cleanedCount;
    }
    /**
     * Cleanup all registered resources
     */
    cleanupAll() {
        const count = this.resources.size;
        console.log(`[ResourceManager] Cleaning up all ${count} resources...`);
        // Cleanup in reverse order of registration (LIFO - Last In First Out)
        const resources = Array.from(this.resources.entries()).toReversed();
        for (const [id, resource] of resources) {
            try {
                resource.cleanup();
                console.log(
                    `[ResourceManager] Cleaned up ${resource.type} resource: ${id}`
                );
            } catch (error) {
                console.error(
                    `[ResourceManager] Error cleaning up resource ${id}:`,
                    error
                );
            }
        }
        this.resources.clear();
        // Also cleanup event listeners managed by eventListenerManager
        try {
            cleanupEventListeners();
        } catch (error) {
            console.error(
                "[ResourceManager] Error cleaning up event listeners:",
                error
            );
        }
        console.log(
            `[ResourceManager] Cleanup complete: ${count} resources cleaned`
        );
        return count;
    }
    /**
     * Get statistics about registered resources
     */
    getStats() {
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
            stats.byType[resource.type] += 1;
            if (resource.owner) {
                stats.byOwner[resource.owner] =
                    (stats.byOwner[resource.owner] ?? 0) + 1;
            }
        }
        return stats;
    }
    /**
     * Get a list of all registered resources (for debugging)
     */
    list() {
        return Array.from(this.resources.values(), (resource) => ({
            id: resource.id,
            timestamp: resource.timestamp,
            type: resource.type,
            ...(resource.owner === undefined ? {} : { owner: resource.owner }),
        }));
    }
    /**
     * Register a new resource for automatic cleanup
     */
    register(type, cleanup, options = {}) {
        if (typeof cleanup !== "function") {
            console.warn("[ResourceManager] Cleanup must be a function");
            return "";
        }
        const id = options.id || `resource-${type}-${this.nextId++}`;
        this.resources.set(id, createResource(type, cleanup, id, options));
        console.log(`[ResourceManager] Registered ${type} resource: ${id}`, {
            owner: options.owner,
            total: this.resources.size,
        });
        return id;
    }
    /**
     * Register a chart for automatic cleanup
     */
    registerChart(chart, options = {}) {
        if (!isDestroyableChart(chart)) {
            console.warn("[ResourceManager] Invalid chart instance");
            return "";
        }
        return this.register(
            "chart",
            () => {
                try {
                    chart.destroy();
                } catch (error) {
                    console.error(
                        "[ResourceManager] Error destroying chart:",
                        error
                    );
                }
            },
            { ...options, instance: chart }
        );
    }
    /**
     * Register an interval for automatic cleanup
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
     */
    registerMap(map, options = {}) {
        if (!isRemovableMap(map)) {
            console.warn("[ResourceManager] Invalid map instance");
            return "";
        }
        return this.register(
            "map",
            () => {
                try {
                    map.remove();
                } catch (error) {
                    console.error(
                        "[ResourceManager] Error removing map:",
                        error
                    );
                }
            },
            { ...options, instance: map }
        );
    }
    /**
     * Register an observer for automatic cleanup
     */
    registerObserver(observer, options = {}) {
        if (!isDisconnectableObserver(observer)) {
            console.warn("[ResourceManager] Invalid observer instance");
            return "";
        }
        return this.register(
            "observer",
            () => {
                try {
                    observer.disconnect();
                } catch (error) {
                    console.error(
                        "[ResourceManager] Error disconnecting observer:",
                        error
                    );
                }
            },
            { ...options, instance: observer }
        );
    }
    /**
     * Register a timer for automatic cleanup
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
     */
    registerWorker(worker, options = {}) {
        if (!isTerminableWorker(worker)) {
            console.warn("[ResourceManager] Invalid worker instance");
            return "";
        }
        return this.register(
            "worker",
            () => {
                try {
                    worker.terminate();
                } catch (error) {
                    console.error(
                        "[ResourceManager] Error terminating worker:",
                        error
                    );
                }
            },
            { ...options, instance: worker }
        );
    }
    /**
     * Remove a shutdown hook
     */
    removeShutdownHook(hook) {
        this.shutdownHooks.delete(hook);
    }
    /**
     * Execute shutdown sequence
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
            Array.from(this.shutdownHooks, async (hook) => {
                try {
                    await hook();
                } catch (error) {
                    console.error(
                        "[ResourceManager] Error in shutdown hook:",
                        error
                    );
                }
            })
        );
        // Cleanup all resources
        this.cleanupAll();
        console.log("[ResourceManager] Shutdown complete");
    }
    /**
     * Unregister and cleanup a specific resource
     */
    unregister(id) {
        const resource = this.resources.get(id);
        if (!resource) {
            return false;
        }
        try {
            resource.cleanup();
            console.log(
                `[ResourceManager] Cleaned up ${resource.type} resource: ${id}`
            );
        } catch (error) {
            console.error(
                `[ResourceManager] Error cleaning up resource ${id}:`,
                error
            );
        }
        this.resources.delete(id);
        return true;
    }
}
// Create singleton instance
const resourceManager = new ResourceManager();
// Setup window cleanup handler (only when addEventListener is available)
if (
    globalThis.window !== undefined &&
    typeof globalThis.window.addEventListener === "function"
) {
    const beforeUnloadController = new AbortController();
    globalThis.window.addEventListener(
        "beforeunload",
        () => {
            console.log(
                "[ResourceManager] Window unload detected, cleaning up resources..."
            );
            resourceManager.cleanupAll();
            beforeUnloadController.abort();
        },
        {
            signal: beforeUnloadController.signal,
        }
    );
}
/**
 * Shared singleton that tracks app resources and centralizes cleanup.
 */
export { resourceManager };
/**
 * Bound resource manager helpers for legacy imports that use named functions.
 */
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
    globalThis.resourceManager = resourceManager;
}
