/** Drag-and-drop event handlers registered as a group. */
export type DragDropHandlers = {
    onDragEnter?: EventListener;
    onDragLeave?: EventListener;
    onDragOver?: EventListener;
    onDrop?: EventListener;
};

/** Add standard drag-and-drop listeners and return a cleanup callback. */
export function addDragDropListeners(
    handlers: DragDropHandlers,
    target?: EventTarget
): () => void;

/** Add an event listener and return a cleanup callback for that listener. */
export function addEventListenerWithCleanup(
    element: EventTarget,
    eventType: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean
): () => void;

/** Remove all tracked event listeners. */
export function cleanupEventListeners(): void;

/** Get the current number of tracked event listeners. */
export function getListenerCount(): number;
