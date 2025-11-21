/**
 * Adds event listeners for common drag and drop operations
 *
 * @param {Object} handlers - Object containing drag and drop event handlers
 * @param {EventListener} handlers.onDragEnter - Handler for dragenter events
 * @param {EventListener} handlers.onDragLeave - Handler for dragleave events
 * @param {EventListener} handlers.onDragOver - Handler for dragover events
 * @param {EventListener} handlers.onDrop - Handler for drop events
 * @param {EventTarget} target - The target element (defaults to window)
 * @returns {Function} Cleanup function to remove all drag and drop listeners
 */
export function addDragDropListeners(
    handlers: {
        onDragEnter: EventListener;
        onDragLeave: EventListener;
        onDragOver: EventListener;
        onDrop: EventListener;
    },
    target?: EventTarget
): Function;
/**
 * Adds an event listener with automatic cleanup tracking
 *
 * @param {EventTarget} element - The element to add the event listener to
 * @param {string} eventType - The type of event to listen for
 * @param {EventListener} handler - The event handler function
 * @param {boolean|AddEventListenerOptions} options - Optional parameters for addEventListener
 * @returns {Function} A function to remove this specific event listener
 */
export function addEventListenerWithCleanup(
    element: EventTarget,
    eventType: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
): Function;
/**
 * Removes all tracked event listeners
 *
 * This function should be called during application cleanup or when transitioning
 * between different application states to prevent memory leaks.
 */
export function cleanupEventListeners(): void;
/**
 * Gets the current number of tracked event listeners
 *
 * @returns {number} The number of currently tracked event listeners
 */
export function getListenerCount(): number;
//# sourceMappingURL=eventListenerManager.d.ts.map
