/**
 * Event Listener Manager
 *
 * Provides utilities for managing event listeners with automatic cleanup
 * capabilities. This is useful for preventing memory leaks by ensuring all
 * event listeners can be properly removed when needed.
 */

import {
    getEventListenerManagerRuntime,
    type EventListenerManagerRuntime,
} from "./eventListenerManagerRuntime.js";

/** Drag-and-drop event handlers registered as a group. */
export type DragDropHandlers = {
    onDragEnter?: EventListener;
    onDragLeave?: EventListener;
    onDragOver?: EventListener;
    onDrop?: EventListener;
};

type CleanupFunction = () => void;

// Store all registered event listeners for cleanup
const registeredListeners = new Set<CleanupFunction>();

/**
 * Adds event listeners for common drag and drop operations
 *
 * @param handlers - Object containing drag and drop event handlers.
 * @param target - The target element; defaults to window.
 *
 * @returns Cleanup function to remove all drag and drop listeners.
 */
export function addDragDropListeners(
    handlers: DragDropHandlers,
    target: EventTarget = globalThis.window,
    runtime: EventListenerManagerRuntime = getEventListenerManagerRuntime()
): CleanupFunction {
    const cleanupFunctions: CleanupFunction[] = [];

    if (handlers.onDragEnter) {
        cleanupFunctions.push(
            addEventListenerWithCleanup(
                target,
                "dragenter",
                handlers.onDragEnter,
                false,
                runtime
            )
        );
    }

    if (handlers.onDragLeave) {
        cleanupFunctions.push(
            addEventListenerWithCleanup(
                target,
                "dragleave",
                handlers.onDragLeave,
                false,
                runtime
            )
        );
    }

    if (handlers.onDragOver) {
        cleanupFunctions.push(
            addEventListenerWithCleanup(
                target,
                "dragover",
                handlers.onDragOver,
                false,
                runtime
            )
        );
    }

    if (handlers.onDrop) {
        cleanupFunctions.push(
            addEventListenerWithCleanup(
                target,
                "drop",
                handlers.onDrop,
                false,
                runtime
            )
        );
    }

    // Return a function that cleans up all the drag and drop listeners
    return () => {
        for (const cleanup of cleanupFunctions) cleanup();
    };
}

/**
 * Adds an event listener with automatic cleanup tracking
 *
 * @param element - The element to add the event listener to.
 * @param eventType - The type of event to listen for.
 * @param handler - The event handler function.
 * @param options - Optional parameters for addEventListener.
 *
 * @returns A function to remove this specific event listener.
 */
export function addEventListenerWithCleanup(
    element: EventTarget | null | undefined,
    eventType: string,
    handler: EventListener | null | undefined,
    options: AddEventListenerOptions | boolean = false,
    runtime: EventListenerManagerRuntime = getEventListenerManagerRuntime()
): CleanupFunction {
    if (!element || typeof element.addEventListener !== "function") {
        console.warn(
            "[EventListenerManager] Invalid element provided to addEventListenerWithCleanup"
        );
        return () => {}; // Return a no-op cleanup function
    }

    if (typeof handler !== "function") {
        console.warn(
            "[EventListenerManager] Invalid handler provided to addEventListenerWithCleanup"
        );
        return () => {}; // Return a no-op cleanup function
    }

    const abortController = runtime.createAbortController();

    if (typeof options === "boolean") {
        element.addEventListener(eventType, handler, {
            capture: options,
            signal: abortController.signal,
        });
    } else {
        element.addEventListener(eventType, handler, {
            ...options,
            signal: abortController.signal,
        });
    }

    // Create a cleanup function for this specific listener
    const cleanup: CleanupFunction = () => {
        try {
            abortController.abort();
            registeredListeners.delete(cleanup);
        } catch (error) {
            console.warn(
                "[EventListenerManager] Error removing event listener:",
                error
            );
        }
    };

    // Track this listener for global cleanup
    registeredListeners.add(cleanup);

    return cleanup;
}

/**
 * Removes all tracked event listeners
 *
 * This function should be called during application cleanup or when
 * transitioning between different application states to prevent memory leaks.
 */
export function cleanupEventListeners(): void {
    let cleanedCount = 0;

    for (const cleanup of registeredListeners) {
        try {
            cleanup();
            cleanedCount += 1;
        } catch (error) {
            console.warn("[EventListenerManager] Error during cleanup:", error);
        }
    }

    // Clear the set after cleanup
    registeredListeners.clear();

    console.log(
        `[EventListenerManager] Cleaned up ${cleanedCount} event listeners`
    );
}

/**
 * Gets the current number of tracked event listeners
 *
 * @returns The number of currently tracked event listeners.
 */
export function getListenerCount(): number {
    return registeredListeners.size;
}
