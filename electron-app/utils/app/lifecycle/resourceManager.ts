import { cleanupEventListeners } from "../../ui/events/eventListenerManager.js";
import {
    clearResourceManagerTimer,
    registerResourceManagerUnloadCleanup,
    type ResourceManagerTimer,
} from "./resourceManagerRuntime.js";

type ResourceType =
    | "chart"
    | "eventListener"
    | "interval"
    | "map"
    | "observer"
    | "other"
    | "timer"
    | "worker";

type ResourceCleanup = () => unknown;
type ShutdownHook = () => unknown;

type Resource = {
    cleanup: ResourceCleanup;
    id: string;
    instance?: unknown;
    owner?: string;
    timestamp: number;
    type: ResourceType;
};

type ResourceOptions = {
    id?: string;
    instance?: unknown;
    owner?: string;
};

type ResourceCleanupFilter = {
    owner?: string;
    type?: ResourceType;
};

type ResourceStats = {
    byOwner: Record<string, number>;
    byType: Record<ResourceType, number>;
    total: number;
};

type ResourceListItem = {
    id: string;
    owner?: string;
    timestamp: number;
    type: ResourceType;
};

type DestroyableChart = { destroy: () => unknown };
type RemovableMap = { remove: () => unknown };
type DisconnectableObserver = { disconnect: () => unknown };
type TerminableWorker = { terminate: () => unknown };
type TimerHandle = ResourceManagerTimer;
type IntervalHandle = ReturnType<typeof setInterval>;

function hasFunctionProperty<TProperty extends string>(
    value: unknown,
    property: TProperty
): value is Record<TProperty, () => unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof Reflect.get(value, property) === "function"
    );
}

function isDestroyableChart(value: unknown): value is DestroyableChart {
    return hasFunctionProperty(value, "destroy");
}

function isDisconnectableObserver(
    value: unknown
): value is DisconnectableObserver {
    return hasFunctionProperty(value, "disconnect");
}

function isRemovableMap(value: unknown): value is RemovableMap {
    return hasFunctionProperty(value, "remove");
}

function isTerminableWorker(value: unknown): value is TerminableWorker {
    return hasFunctionProperty(value, "terminate");
}

function createResource(
    type: ResourceType,
    cleanup: ResourceCleanup,
    id: string,
    options: ResourceOptions
): Resource {
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
    private isShuttingDown = false;

    private nextId = 1;

    private readonly resources = new Map<string, Resource>();

    private readonly shutdownHooks = new Set<ShutdownHook>();

    public constructor() {
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
    public addShutdownHook(hook: ShutdownHook): void {
        if (typeof hook === "function") {
            this.shutdownHooks.add(hook);
        }
    }

    /**
     * Cleanup resources by filter criteria
     */
    public cleanup(filter: ResourceCleanupFilter = {}): number {
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
                    cleanedCount += 1;
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
    public cleanupAll(): number {
        const count = this.resources.size;
        console.log(`[ResourceManager] Cleaning up all ${count} resources...`);

        // Cleanup in reverse order of registration (LIFO - Last In First Out)
        const resources = [...this.resources.entries()];
        resources.reverse();

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
    public getStats(): ResourceStats {
        const stats: ResourceStats = {
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
    public list(): ResourceListItem[] {
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
    public register(
        type: ResourceType,
        cleanup: ResourceCleanup,
        options: ResourceOptions = {}
    ): string {
        if (typeof cleanup !== "function") {
            console.warn("[ResourceManager] Cleanup must be a function");
            return "";
        }

        const nextId = this.nextId;
        this.nextId += 1;
        const id = options.id || `resource-${type}-${nextId}`;

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
    public registerChart(
        chart: unknown,
        options: Omit<ResourceOptions, "instance"> = {}
    ): string {
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
    public registerInterval(
        intervalId: IntervalHandle,
        options: Omit<ResourceOptions, "instance"> = {}
    ): string {
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
    public registerMap(
        map: unknown,
        options: Omit<ResourceOptions, "instance"> = {}
    ): string {
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
    public registerObserver(
        observer: unknown,
        options: Omit<ResourceOptions, "instance"> = {}
    ): string {
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
    public registerTimer(
        timerId: TimerHandle,
        options: Omit<ResourceOptions, "instance"> = {}
    ): string {
        return this.register(
            "timer",
            () => {
                clearResourceManagerTimer(timerId);
            },
            { ...options, instance: timerId }
        );
    }

    /**
     * Register a web worker for automatic cleanup
     */
    public registerWorker(
        worker: unknown,
        options: Omit<ResourceOptions, "instance"> = {}
    ): string {
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
    public removeShutdownHook(hook: ShutdownHook): void {
        this.shutdownHooks.delete(hook);
    }

    /**
     * Execute shutdown sequence
     */
    public async shutdown(): Promise<void> {
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
    public unregister(id: string): boolean {
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

registerResourceManagerUnloadCleanup(() => {
    console.log(
        "[ResourceManager] Window unload detected, cleaning up resources..."
    );
    resourceManager.cleanupAll();
});

/**
 * Shared singleton that tracks app resources and centralizes cleanup.
 */
export { resourceManager };
/**
 * Bound resource manager helpers for legacy imports that use named functions.
 */
export const addShutdownHook = (hook: ShutdownHook): void => {
    resourceManager.addShutdownHook(hook);
};
export const cleanup = (filter?: ResourceCleanupFilter): number =>
    resourceManager.cleanup(filter);
export const cleanupAll = (): number => resourceManager.cleanupAll();
export const getStats = (): ResourceStats => resourceManager.getStats();
export const list = (): ResourceListItem[] => resourceManager.list();
export const register = (
    type: ResourceType,
    resourceCleanup: ResourceCleanup,
    options?: ResourceOptions
): string => resourceManager.register(type, resourceCleanup, options);
export const registerChart = (
    chart: unknown,
    options?: Omit<ResourceOptions, "instance">
): string => resourceManager.registerChart(chart, options);
export const registerInterval = (
    intervalId: IntervalHandle,
    options?: Omit<ResourceOptions, "instance">
): string => resourceManager.registerInterval(intervalId, options);
export const registerMap = (
    map: unknown,
    options?: Omit<ResourceOptions, "instance">
): string => resourceManager.registerMap(map, options);
export const registerObserver = (
    observer: unknown,
    options?: Omit<ResourceOptions, "instance">
): string => resourceManager.registerObserver(observer, options);
export const registerTimer = (
    timerId: TimerHandle,
    options?: Omit<ResourceOptions, "instance">
): string => resourceManager.registerTimer(timerId, options);
export const registerWorker = (
    worker: unknown,
    options?: Omit<ResourceOptions, "instance">
): string => resourceManager.registerWorker(worker, options);
export const shutdown = (): Promise<void> => resourceManager.shutdown();
export const unregister = (id: string): boolean =>
    resourceManager.unregister(id);
