import {
    getState,
    setState,
    subscribe,
} from "../../state/core/stateManager.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";

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
 * Initialize renderer utilities with state management.
 */
export function initializeRendererUtils(): void {
    subscribe("isLoading", (loading) => {
        updateLoadingUI(loading === true);
    });

    subscribe("ui.currentNotification", (notification) => {
        const normalizedNotification = normalizeNotification(notification);

        if (normalizedNotification) {
            updateNotificationUI(normalizedNotification);
        }
    });

    console.log("[RendererUtils] State management initialized");
}

/**
 * Get current loading state.
 */
export function isLoading(): boolean {
    return getState("isLoading") === true;
}

/**
 * Shows or hides the loading overlay and updates the cursor style.
 */
export function setLoading(loading: boolean): void {
    setState("isLoading", loading, { source: "setLoading" });

    const overlay = querySelectorByIdFlexible(document, "#loading_overlay");

    if (!overlay) {
        console.warn("[RendererUtils] Loading overlay element not found");
        return;
    }

    overlay.style.display = loading ? "flex" : "none";
    document.body.style.cursor = loading ? "wait" : "";
    overlay.setAttribute("aria-hidden", String(!loading));
    document.body.setAttribute("aria-busy", String(loading));

    console.log(`[RendererUtils] Loading state: ${loading}`);
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

function clearNotificationHideTimeout(): void {
    if (notificationHideTimeout !== undefined) {
        clearTimeout(notificationHideTimeout);
        notificationHideTimeout = undefined;
    }
}

function updateLoadingUI(loading: boolean): void {
    const overlay = querySelectorByIdFlexible(document, "#loading_overlay");

    if (overlay) {
        overlay.style.display = loading ? "flex" : "none";
        overlay.setAttribute("aria-hidden", String(!loading));
    }

    document.body.style.cursor = loading ? "wait" : "";
    document.body.setAttribute("aria-busy", String(loading));

    const interactiveElements = document.querySelectorAll(
        "button, input, select, textarea"
    );

    for (const element of interactiveElements) {
        if (element.id === "open_file_btn") {
            continue;
        }

        if (element.classList.contains("tab-button")) {
            continue;
        }

        if (isDisableableFormControl(element)) {
            if (loading) {
                element.dataset["wasDisabled"] = String(element.disabled);
                element.disabled = true;
            } else {
                element.disabled = element.dataset["wasDisabled"] === "true";
                delete element.dataset["wasDisabled"];
            }
        }
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

    const candidate = value as Record<string, unknown>;

    if (
        typeof candidate["message"] === "string" &&
        isNotificationType(candidate["type"])
    ) {
        const timestamp = candidate["timestamp"];

        return typeof timestamp === "number"
            ? {
                  message: candidate["message"],
                  timestamp,
                  type: candidate["type"],
              }
            : {
                  message: candidate["message"],
                  type: candidate["type"],
              };
    }

    return null;
}

function isNotificationType(value: unknown): value is NotificationType {
    return (
        value === "error" ||
        value === "info" ||
        value === "success" ||
        value === "warning"
    );
}

function isDisableableFormControl(
    element: Element
): element is
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement {
    return (
        element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
    );
}
