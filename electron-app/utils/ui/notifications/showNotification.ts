// Enhanced notification utility with modern animations, icons, and queue management

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";

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

type HideTimeout = number | ReturnType<typeof setTimeout>;

/** Notification host element with an optional scheduled hide timer. */
export type NotificationElement = HTMLElement & {
    hideTimeout?: HideTimeout;
    notificationToken?: number;
};

// Notification queue for managing multiple notifications
let isShowingNotification = false;
const notificationQueue: QueuedNotification[] = [];
const activeAnimationFrames = new Set<number>();
const activeTimeouts = new Set<HideTimeout>();
let notificationDisplayToken = 0;

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
    const el = document.querySelector<HTMLElement>(
        "#notification"
    ) as NotificationElement | null;
    if (el) {
        // Clear any pending timers and hide immediately
        if (el.hideTimeout) {
            clearNotificationTimeout(el.hideTimeout);
            delete el.hideTimeout;
        }
        el.classList.remove("show");
        el.style.display = "none";
        el.onclick = null;
        el.style.cursor = "default";
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
    const notificationElement = document.querySelector<HTMLElement>(
        "#notification"
    ) as NotificationElement | null;
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
    type: NotificationType | string = "info",
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
    let resolveShown: () => void = () => {};
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
        processNotificationQueue();
    }

    return shownPromise;
}

/** Builds the notification content with icon, message, and actions. */
async function buildNotificationContent(
    element: NotificationElement,
    notification: QueuedNotification
): Promise<void> {
    // Clear previous content
    element.replaceChildren();

    // Set accessibility attributes
    element.setAttribute("role", "alert");
    element.setAttribute(
        "aria-label",
        `${notification.ariaLabel}: ${notification.message}`
    );
    element.setAttribute("aria-live", "polite");

    // Create main content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "notification-content";
    contentContainer.style.cssText =
        "display: flex; align-items: center; gap: 12px; flex: 1;";

    // Add icon if provided
    if (notification.icon) {
        const iconElement = document.createElement("span");
        iconElement.className = "notification-icon";
        iconElement.textContent = notification.icon;
        iconElement.style.cssText = "font-size: 1.2rem; flex-shrink: 0;";
        contentContainer.append(iconElement);
    }

    // Add message
    const messageElement = document.createElement("span");
    messageElement.className = "notification-message";
    messageElement.textContent = notification.message;
    messageElement.style.cssText = "flex: 1; text-align: left;";
    contentContainer.append(messageElement);

    element.append(contentContainer);

    // Add action buttons if provided
    if (notification.actions.length > 0) {
        const actionsContainer = document.createElement("div");
        actionsContainer.className = "notification-actions";
        actionsContainer.style.cssText =
            "display: flex; gap: 8px; margin-left: 12px;";

        for (const action of notification.actions) {
            const button = document.createElement("button");
            button.textContent = action.text;
            button.className = action.className || "themed-btn";
            button.style.cssText = "font-size: 0.9rem; padding: 6px 12px;";
            addEventListenerWithCleanup(button, "click", (event) => {
                event.stopPropagation();
                if (action.onClick) {
                    action.onClick();
                }
                hideNotification(element);
            });
            actionsContainer.append(button);
        }

        element.append(actionsContainer);
    }

    // Add click handler for main notification
    if (notification.onClick) {
        element.style.cursor = "pointer";
        addEventListenerWithCleanup(element, "click", (event) => {
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
    }

    // Add close button for persistent notifications
    if (!notification.duration) {
        const closeButton = document.createElement("button");
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
        addEventListenerWithCleanup(
            closeButton,
            "mouseover",
            () => (closeButton.style.opacity = "1")
        );
        addEventListenerWithCleanup(
            closeButton,
            "mouseout",
            () => (closeButton.style.opacity = "0.7")
        );
        addEventListenerWithCleanup(closeButton, "click", (event) => {
            event.stopPropagation();
            hideNotification(element);
        });
        element.append(closeButton);
    }
}

/** Displays a single notification with animations. */
async function displayNotification(
    notification: QueuedNotification
): Promise<void> {
    const notificationElement = document.querySelector<HTMLElement>(
        "#notification"
    ) as NotificationElement | null;
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
        return;
    }

    // Clear any existing timeout
    if (notificationElement.hideTimeout) {
        clearNotificationTimeout(notificationElement.hideTimeout);
        delete notificationElement.hideTimeout;
    }

    // Build notification content
    await buildNotificationContent(notificationElement, notification);

    // Show notification with animation
    notificationElement.notificationToken = notificationDisplayToken += 1;
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
        element.onclick = null;
        element.style.cursor = "default";
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
async function processNotificationQueue(): Promise<void> {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    if (isShowingNotification) {
        // Already showing; next item will be processed when current one completes
        return;
    }

    isShowingNotification = true;
    const notification = notificationQueue.shift();

    try {
        if (notification) {
            await displayNotification(notification);
        }
    } catch (error) {
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
        const errObj =
            error instanceof Error ? error : new Error(String(error));
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

    // Reset flag and process next notification
    isShowingNotification = false;

    // Immediately process the next notification if queued
    if (notificationQueue.length > 0) {
        // Process next notification without blocking
        processNotificationQueue();
    }
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
        type: NotificationType | string = "info",
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
        type: NotificationType | string = "info",
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
    clearTimeout(timer);
    activeTimeouts.delete(timer);
}

function clearScheduledWork(): void {
    for (const frame of activeAnimationFrames) {
        cancelNotificationAnimationFrame(frame);
    }
    activeAnimationFrames.clear();

    for (const timer of activeTimeouts) {
        clearTimeout(timer);
    }
    activeTimeouts.clear();
}

function isNotificationType(value: string): value is NotificationType {
    return Object.hasOwn(NOTIFICATION_TYPES, value);
}

function scheduleAnimationFrame(callback: FrameRequestCallback): number {
    const requestFrame =
        globalThis.window?.requestAnimationFrame ??
        globalThis.requestAnimationFrame;
    let completedSynchronously = false;
    let frame: number | undefined;

    frame = requestFrame.call(globalThis.window ?? globalThis, (time) => {
        completedSynchronously = true;
        if (frame !== undefined) {
            activeAnimationFrames.delete(frame);
        }
        callback(time);
    });
    if (!completedSynchronously) {
        activeAnimationFrames.add(frame);
    }
    return frame;
}

function scheduleNotificationTimeout(
    callback: () => void,
    duration: number
): HideTimeout {
    const timer = setTimeout(() => {
        activeTimeouts.delete(timer);
        callback();
    }, duration);
    activeTimeouts.add(timer);
    return timer;
}

function cancelNotificationAnimationFrame(frame: number): void {
    const cancelFrame =
        globalThis.window?.cancelAnimationFrame ??
        globalThis.cancelAnimationFrame;
    cancelFrame.call(globalThis.window ?? globalThis, frame);
}
