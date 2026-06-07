import {
    getState,
    setState,
} from "../../state/core/stateManager.js";
import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";

/** Notification variants rendered by renderer utility helpers. */
export type NotificationType = "error" | "info" | "success" | "warning";

/** Notification state stored under ui.currentNotification. */
export type RendererNotification = {
    message: string;
    timestamp?: number;
    type: NotificationType;
};

let notificationHideTimeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Clear current notification.
 */
export function clearNotification(): void {
    clearNotificationHideTimeout();

    const notificationElement = querySelectorByIdFlexible(
        document,
        "#notification"
    );

    if (notificationElement) {
        notificationElement.style.display = "none";
    }

    setState("ui.currentNotification", null, { source: "clearNotification" });
}

/**
 * Get current notification.
 */
export function getCurrentNotification(): null | RendererNotification {
    return normalizeNotification(getState("ui.currentNotification"));
}

/**
 * Show error notification with standard styling.
 */
export function showError(message: string, timeout = 5000): void {
    showNotification(message, "error", timeout);
}

/**
 * Show info notification with standard styling.
 */
export function showInfo(message: string, timeout = 4000): void {
    showNotification(message, "info", timeout);
}

/**
 * Displays a notification message in the UI with state tracking.
 */
export function showNotification(
    message: string,
    type: NotificationType = "error",
    timeout = 5000
): void {
    const notificationElement = querySelectorByIdFlexible(
        document,
        "#notification"
    );

    if (!notificationElement) {
        console.warn("[RendererUtils] Notification element not found");
        return;
    }

    clearNotificationHideTimeout();

    notificationElement.textContent = message;
    notificationElement.className = `notification ${type}`;
    notificationElement.style.display = "block";

    setState(
        "ui.currentNotification",
        {
            message,
            timestamp: Date.now(),
            type,
        } satisfies RendererNotification,
        { source: "showNotification" }
    );

    if (timeout > 0) {
        notificationHideTimeout = setTimeout(() => {
            notificationHideTimeout = undefined;
            notificationElement.style.display = "none";
            setState("ui.currentNotification", null, {
                source: "showNotification",
            });
        }, timeout);
    }

    console.log(`[RendererUtils] Notification shown: ${type} - ${message}`);
}

/**
 * Show success notification with standard styling.
 */
export function showSuccess(message: string, timeout = 3000): void {
    showNotification(message, "success", timeout);
}

/**
 * Show warning notification with standard styling.
 */
export function showWarning(message: string, timeout = 4000): void {
    showNotification(message, "warning", timeout);
}

export function updateNotificationFromState(notification: unknown): void {
    const normalizedNotification = normalizeNotification(notification);

    if (normalizedNotification) {
        updateNotificationUI(normalizedNotification);
    }
}

function clearNotificationHideTimeout(): void {
    if (notificationHideTimeout !== undefined) {
        clearTimeout(notificationHideTimeout);
        notificationHideTimeout = undefined;
    }
}

function updateNotificationUI(notification: RendererNotification): void {
    const notificationElement = querySelectorByIdFlexible(
        document,
        "#notification"
    );

    if (!notificationElement) {
        return;
    }

    notificationElement.textContent = notification.message;
    notificationElement.className = `notification ${notification.type}`;
    notificationElement.style.display = "block";
    notificationElement.setAttribute("role", "alert");
    notificationElement.setAttribute("aria-live", "polite");
}

function normalizeNotification(value: unknown): null | RendererNotification {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const message = getNotificationProperty(value, "message");
    const type = getNotificationProperty(value, "type");

    if (typeof message === "string" && isNotificationType(type)) {
        const timestamp = getNotificationProperty(value, "timestamp");

        return typeof timestamp === "number"
            ? {
                  message,
                  timestamp,
                  type,
              }
            : {
                  message,
                  type,
              };
    }

    return null;
}

function getNotificationProperty(
    value: object,
    key: "message" | "timestamp" | "type"
): unknown {
    return key in value ? value[key as keyof typeof value] : undefined;
}

function isNotificationType(value: unknown): value is NotificationType {
    return (
        value === "error" ||
        value === "info" ||
        value === "success" ||
        value === "warning"
    );
}
