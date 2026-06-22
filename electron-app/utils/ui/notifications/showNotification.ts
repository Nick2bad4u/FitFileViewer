// Enhanced notification utility with modern animations, icons, and queue management

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import {
    getShowNotificationRuntime,
    type ShowNotificationTimerHandle,
} from "./showNotificationRuntime.js";

/** Notification variants supported by the renderer notification utility. */
export type NotificationType = "error" | "info" | "success" | "warning";

type NotificationTypeConfig = {
    readonly ariaLabel: string;
    readonly duration: number;
    readonly icon: string;
};

/** Action button shown inside a notification. */
export type NotificationAction = {
    readonly className?: string;
    readonly onClick?: () => void;
    readonly text: string;
};

/** Options accepted by the renderer notification utility. */
export type NotificationOptions = {
    readonly actions?: readonly NotificationAction[];
    readonly icon?: string;
    readonly onClick?: () => void;
    readonly persistent?: boolean;
};

/** Internal queue item used to serialize notification rendering. */
export type QueuedNotification = {
    readonly actions: readonly NotificationAction[];
    readonly ariaLabel: string;
    readonly duration: null | number;
    readonly icon: string;
    readonly message: string;
    readonly onClick: (() => void) | undefined;
    resolveShown: (() => void) | undefined;
    readonly timestamp: number;
    readonly type: NotificationType;
};

type HideTimeout = ShowNotificationTimerHandle;
type CleanupFunction = () => void;

/** Notification host element with an optional scheduled hide timer. */
export type NotificationElement = HTMLElement & {
    hideTimeout?: HideTimeout;
    listenerCleanups?: CleanupFunction[];
    notificationToken?: number;
};

// Notification queue for managing multiple notifications
let isShowingNotification = false;
const notificationQueue: QueuedNotification[] = [];
const activeAnimationFrames = new Set<number>();
const activeTimeouts = new Set<HideTimeout>();
let notificationDisplayToken = 0;
const noopResolveShown = (): void => {};
const showNotificationRuntime = getShowNotificationRuntime();

// Notification type configurations with icons and default durations
const NOTIFICATION_TYPES: Record<NotificationType, NotificationTypeConfig> = {
    error: { ariaLabel: "Error", duration: 6000, icon: "❌" },
    info: { ariaLabel: "Information", duration: 4000, icon: "ℹ️" },
    success: { ariaLabel: "Success", duration: 3000, icon: "✅" },
    warning: { ariaLabel: "Warning", duration: 5000, icon: "⚠️" },
};

/**
 * Test-only helper to reset internal notification state between tests. Not
 * intended for production use.
 */
export function __testResetNotifications(): void {
    notificationQueue.length = 0;
    isShowingNotification = false;
    notificationDisplayToken = 0;
    clearScheduledWork();
    const el =
        showNotificationRuntime.queryElement<NotificationElement>(
            "#notification"
        );
    if (el) {
        clearNotificationElementListeners(el);
        // Clear any pending timers and hide immediately
        if (el.hideTimeout) {
            clearNotificationTimeout(el.hideTimeout);
            delete el.hideTimeout;
        }
        el.classList.remove("show");
        el.style.display = "none";
        el.style.cursor = "default";
        el.removeAttribute("tabindex");
        delete el.notificationToken;
        el.replaceChildren();
    }
}

/**
 * Clears all notifications from the queue and hides current notification
 */
export function clearAllNotifications(): void {
    notificationQueue.length = 0;
    clearScheduledWork();
    const notificationElement =
        showNotificationRuntime.queryElement<NotificationElement>(
            "#notification"
        );
    if (notificationElement) {
        hideNotification(notificationElement);
    }
    isShowingNotification = false;
}

/**
 * Shows a queued renderer notification with animations, optional action
 * buttons, and per-type default durations.
 *
 * @param message - Message to display.
 * @param type - Notification variant. Unknown strings fall back to info.
 * @param duration - Duration in milliseconds, or null for the type default.
 * @param options - Additional display and interaction options.
 *
 * @returns Promise that resolves when this notification becomes visible.
 */
export async function showNotification(
    message: string,
    type = "info",
    duration: null | number = null,
    options: NotificationOptions = {}
): Promise<void> {
    // Validate inputs
    if (!message || typeof message !== "string") {
        console.warn("showNotification: Invalid message provided");
        return;
    }

    const normalizedType = isNotificationType(type) ? type : "info";
    if (normalizedType !== type) {
        console.warn(
            `showNotification: Unknown notification type '${type}', falling back to 'info'`
        );
    }

    const config = NOTIFICATION_TYPES[normalizedType];
    const finalDuration = options.persistent
        ? null
        : typeof duration === "number"
          ? duration
          : config.duration;

    // Promise that resolves when THIS notification becomes visible
    let resolveShown = noopResolveShown;
    const shownPromise = new Promise<void>((resolve) => {
        resolveShown = resolve;
    });

    // Create notification object
    const notification: QueuedNotification = {
        actions: options.actions ?? [],
        ariaLabel: config.ariaLabel,
        duration: finalDuration,
        icon: options.icon ?? config.icon,
        message,
        onClick: options.onClick,
        resolveShown,
        timestamp: Date.now(),
        type: normalizedType,
    };

    // Add to queue
    notificationQueue.push(notification);

    // Process queue if not already showing
    if (!isShowingNotification) {
        // Process queue without blocking caller
        void processNotificationQueue();
    }

    return shownPromise;
}

/** Builds the notification content with icon, message, and actions. */
function buildNotificationContent(
    element: NotificationElement,
    notification: QueuedNotification
): void {
    clearNotificationElementListeners(element);

    // Clear previous content
    element.replaceChildren();
    element.style.cursor = "default";
    element.removeAttribute("tabindex");

    // Set accessibility attributes
    element.setAttribute("role", "alert");
    element.setAttribute(
        "aria-label",
        `${notification.ariaLabel}: ${notification.message}`
    );
    element.setAttribute("aria-live", "polite");

    // Create main content container
    const contentContainer = showNotificationRuntime.createElement("div");
    contentContainer.className = "notification-content";
    contentContainer.style.cssText =
        "display: flex; align-items: center; gap: 12px; flex: 1;";

    // Add icon if provided
    if (notification.icon) {
        const iconElement = showNotificationRuntime.createElement("span");
        iconElement.className = "notification-icon";
        iconElement.setAttribute("aria-hidden", "true");
        iconElement.textContent = notification.icon;
        iconElement.style.cssText = "font-size: 1.2rem; flex-shrink: 0;";
        contentContainer.append(iconElement);
    }

    // Add message
    const messageElement = showNotificationRuntime.createElement("span");
    messageElement.className = "notification-message";
    messageElement.textContent = notification.message;
    messageElement.style.cssText = "flex: 1; text-align: left;";
    contentContainer.append(messageElement);

    element.append(contentContainer);

    // Add action buttons if provided
    if (notification.actions.length > 0) {
        const actionsContainer = showNotificationRuntime.createElement("div");
        actionsContainer.className = "notification-actions";
        actionsContainer.style.cssText =
            "display: flex; gap: 8px; margin-left: 12px;";

        for (const action of notification.actions) {
            const button = showNotificationRuntime.createElement("button");
            button.textContent = action.text;
            button.className = action.className || "themed-btn";
            button.style.cssText = "font-size: 0.9rem; padding: 6px 12px;";
            addNotificationEventListener(element, button, "click", (event) => {
                event.stopPropagation();
                action.onClick?.();
                hideNotification(element);
            });
            actionsContainer.append(button);
        }

        element.append(actionsContainer);
    }

    // Add click handler for main notification
    if (notification.onClick) {
        element.style.cursor = "pointer";
        element.tabIndex = 0;
        addNotificationEventListener(element, element, "click", (event) => {
            const tgt =
                event.target instanceof HTMLElement ? event.target : null;
            if (
                tgt &&
                !tgt.closest(".notification-actions") &&
                notification.onClick
            ) {
                notification.onClick();
                hideNotification(element);
            }
        });
        addNotificationEventListener(element, element, "keydown", (event) => {
            if (!(event instanceof KeyboardEvent)) {
                return;
            }
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }
            const tgt =
                event.target instanceof HTMLElement ? event.target : null;
            if (tgt?.closest(".notification-actions")) {
                return;
            }

            event.preventDefault();
            notification.onClick?.();
            hideNotification(element);
        });
    }

    // Add close button for persistent notifications
    if (!notification.duration) {
        const closeButton = showNotificationRuntime.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Close notification");
        closeButton.className = "notification-close";
        closeButton.style.cssText = `
			background: none;
			border: none;
			color: inherit;
			font-size: 1.5rem;
			cursor: pointer;
			padding: 0;
			margin-left: 12px;
			opacity: 0.7;
			transition: opacity 0.2s ease;
		`;
        addNotificationEventListener(
            element,
            closeButton,
            "mouseover",
            () => (closeButton.style.opacity = "1")
        );
        addNotificationEventListener(
            element,
            closeButton,
            "mouseout",
            () => (closeButton.style.opacity = "0.7")
        );
        addNotificationEventListener(element, closeButton, "click", (event) => {
            event.stopPropagation();
            hideNotification(element);
        });
        element.append(closeButton);
    }
}

/** Displays a single notification with animations. */
function displayNotification(notification: QueuedNotification): Promise<void> {
    const notificationElement =
        showNotificationRuntime.queryElement<NotificationElement>(
            "#notification"
        );
    if (!notificationElement) {
        // Resolve shown even if the element is missing so callers don't hang
        if (typeof notification.resolveShown === "function") {
            try {
                notification.resolveShown();
            } finally {
                notification.resolveShown = undefined;
            }
        }
        console.warn(
            "Notification element not found. Unable to display notification."
        );
        return Promise.resolve();
    }

    // Clear any existing timeout
    if (notificationElement.hideTimeout) {
        clearNotificationTimeout(notificationElement.hideTimeout);
        delete notificationElement.hideTimeout;
    }

    // Build notification content
    buildNotificationContent(notificationElement, notification);

    // Show notification with animation
    notificationDisplayToken += 1;
    notificationElement.notificationToken = notificationDisplayToken;
    notificationElement.className = `notification ${notification.type}`;
    notificationElement.style.display = "flex";

    // Trigger animation on next frame for smooth effect
    scheduleAnimationFrame(() => {
        notificationElement.classList.add("show");
    });

    // Resolve the external promise to indicate the notification is now visible
    if (typeof notification.resolveShown === "function") {
        try {
            notification.resolveShown();
        } finally {
            notification.resolveShown = undefined;
        }
    }

    // Set up auto-hide if not persistent
    if (notification.duration) {
        notificationElement.hideTimeout = scheduleNotificationTimeout(() => {
            hideNotification(notificationElement);
        }, notification.duration);
    }

    // Return a promise that resolves after the display duration + transition time (used to serialize the queue)
    // Match hideNotification's 300ms transition to ensure proper sequencing in tests
    const totalTime = notification.duration
        ? notification.duration + 300
        : 1000;
    return new Promise<void>((resolve) => {
        scheduleNotificationTimeout(() => resolve(), totalTime);
    });
}

/** Hides the notification with animation. */
function hideNotification(element: NotificationElement): void {
    const hideToken = element.notificationToken;

    if (element.hideTimeout) {
        clearNotificationTimeout(element.hideTimeout);
        delete element.hideTimeout;
    }

    element.classList.remove("show");

    // Hide element after animation completes
    scheduleNotificationTimeout(() => {
        if (element.notificationToken !== hideToken) {
            return;
        }
        element.style.display = "none";
        element.style.cursor = "default";
        element.removeAttribute("tabindex");
        clearNotificationElementListeners(element);
        delete element.notificationToken;
    }, 300); // Match CSS transition duration
}

// TEST HOOKS: expose internals for unit tests that need to manipulate queue state directly
// These named exports are intentionally provided for the test suite (jsdom environment)
// To validate queue behavior and edge cases without relying on private scope hacks.
export { isShowingNotification, notificationQueue, processNotificationQueue };

/**
 * Processes the notification queue, showing notifications one at a time
 */
function processNotificationQueue(): Promise<void> {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return Promise.resolve();
    }

    if (isShowingNotification) {
        // Already showing; next item will be processed when current one completes
        return Promise.resolve();
    }

    isShowingNotification = true;
    const notification = notificationQueue.shift();

    const displayPromise = notification
        ? Promise.resolve().then(() => displayNotification(notification))
        : Promise.resolve();

    return displayPromise
        .catch((error: unknown) => {
            handleNotificationDisplayError(notification, error);
        })
        .then(() => {
            // Reset flag and process next notification
            isShowingNotification = false;

            // Immediately process the next notification if queued
            if (notificationQueue.length > 0) {
                return processNotificationQueue();
            }
            return undefined;
        });
}

/**
 * Convenience methods for common notification types
 */
export const notify = {
    /** Shows an error notification. */
    error: (
        message: string,
        duration?: null | number,
        options?: NotificationOptions
    ) => showNotification(message, "error", duration, options),

    /** Shows an info notification. */
    info: (
        message: string,
        duration?: null | number,
        options?: NotificationOptions
    ) => showNotification(message, "info", duration, options),

    /**
     * Shows a persistent notification that requires user interaction to
     * dismiss.
     */
    persistent: (
        message: string,
        type = "info",
        options: NotificationOptions = {}
    ) =>
        showNotification(message, type, undefined, {
            ...options,
            persistent: true,
        }),

    /** Shows a success notification. */
    success: (
        message: string,
        duration?: null | number,
        options?: NotificationOptions
    ) => showNotification(message, "success", duration, options),

    /** Shows a warning notification. */
    warning: (
        message: string,
        duration?: null | number,
        options?: NotificationOptions
    ) => showNotification(message, "warning", duration, options),

    /** Shows a notification with action buttons. */
    withActions: (
        message: string,
        type = "info",
        actions: readonly NotificationAction[] = [],
        options: NotificationOptions = {}
    ) =>
        showNotification(message, type, undefined, {
            ...options,
            actions,
            persistent: true,
        }),
};

function clearNotificationTimeout(timer: HideTimeout): void {
    showNotificationRuntime.clearTimeout(timer);
    activeTimeouts.delete(timer);
}

function addNotificationEventListener(
    owner: NotificationElement,
    target: EventTarget,
    eventType: string,
    handler: EventListener,
    options: AddEventListenerOptions | boolean = false
): void {
    const cleanup = addEventListenerWithCleanup(
        target,
        eventType,
        handler,
        options
    );
    owner.listenerCleanups ??= [];
    owner.listenerCleanups.push(cleanup);
}

function clearNotificationElementListeners(element: NotificationElement): void {
    const cleanups = element.listenerCleanups;
    if (!cleanups) {
        return;
    }

    for (const cleanup of cleanups.splice(0)) {
        cleanup();
    }
    delete element.listenerCleanups;
}

function handleNotificationDisplayError(
    notification: QueuedNotification | undefined,
    error: unknown
): void {
    // Ensure the shown promise is resolved on error
    if (notification && typeof notification.resolveShown === "function") {
        try {
            notification.resolveShown();
        } catch {
            /* Ignore */
        } finally {
            notification.resolveShown = undefined;
        }
    }
    // Log in two-argument form to preserve error object context for tests and debugging
    const errObj = error instanceof Error ? error : new Error(String(error));
    console.error("Error displaying notification:", errObj);
    // Also log a single-string form for tests that assert substring matching on a single argument
    try {
        const msg =
            errObj && typeof errObj.message === "string"
                ? errObj.message
                : String(errObj);
        console.error(`Error displaying notification: ${msg}`);
    } catch {
        /* No-op */
    }
}

function clearScheduledWork(): void {
    for (const frame of activeAnimationFrames) {
        cancelNotificationAnimationFrame(frame);
    }
    activeAnimationFrames.clear();

    for (const timer of activeTimeouts) {
        showNotificationRuntime.clearTimeout(timer);
    }
    activeTimeouts.clear();
}

function isNotificationType(value: string): value is NotificationType {
    return Object.hasOwn(NOTIFICATION_TYPES, value);
}

function scheduleAnimationFrame(callback: FrameRequestCallback): null | number {
    let completedSynchronously = false;
    const frameReference: { current?: number } = {};

    const frame = showNotificationRuntime.requestAnimationFrame((time) => {
        completedSynchronously = true;
        const currentFrame = frameReference.current;
        if (currentFrame !== undefined) {
            activeAnimationFrames.delete(currentFrame);
        }
        callback(time);
    });
    if (frame !== null) {
        frameReference.current = frame;
    }
    if (frame !== null && !completedSynchronously) {
        activeAnimationFrames.add(frame);
    }
    return frame;
}

function scheduleNotificationTimeout(
    callback: () => void,
    duration: number
): HideTimeout {
    const timer = showNotificationRuntime.setTimeout(() => {
        activeTimeouts.delete(timer);
        callback();
    }, duration);
    activeTimeouts.add(timer);
    return timer;
}

function cancelNotificationAnimationFrame(frame: number): void {
    showNotificationRuntime.cancelAnimationFrame(frame);
}
