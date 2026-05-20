/** Drag-and-drop event handlers registered as a group. */
export type DragDropHandlers = {
    onDragEnter?: EventListener;
    onDragLeave?: EventListener;
    onDragOver?: EventListener;
    onDrop?: EventListener;
};
/** Add event listeners for common drag and drop operations. */
export function addDragDropListeners(
    handlers: DragDropHandlers,
    target?: EventTarget
): () => void;
/**
 * Adds an event listener with automatic cleanup tracking.
 */
export function addEventListenerWithCleanup(
    element: EventTarget | null | undefined,
    eventType: string,
    handler: EventListener | null | undefined,
    options?: boolean | AddEventListenerOptions
): () => void;
/**
 * Removes all tracked event listeners.
 *
 * This function should be called during application cleanup or when
 * transitioning between different application states to prevent memory leaks.
 */
export function cleanupEventListeners(): void;
/** Gets the current number of tracked event listeners. */
export function getListenerCount(): number;
