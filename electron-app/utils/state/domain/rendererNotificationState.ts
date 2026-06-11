import {
    getState,
    setState,
    subscribe,
    type StateUpdateOptions,
} from "../core/stateManager.js";

/** Notification variants rendered by renderer utility helpers. */
export type NotificationType = "error" | "info" | "success" | "warning";

/** Notification state stored for the renderer notification surface. */
export type RendererNotification = {
    message: string;
    timestamp?: number;
    type: NotificationType;
};

const CURRENT_NOTIFICATION_STATE_PATH = "ui.currentNotification";

type NotificationListener = (
    notification: null | RendererNotification
) => void;

export function clearCurrentNotification(
    options: StateUpdateOptions = {}
): void {
    setState(CURRENT_NOTIFICATION_STATE_PATH, null, {
        source: "rendererNotificationState.clear",
        ...options,
    });
}

export function getCurrentRendererNotification(): null | RendererNotification {
    return normalizeRendererNotification(
        getState(CURRENT_NOTIFICATION_STATE_PATH)
    );
}

export function setCurrentRendererNotification(
    notification: RendererNotification,
    options: StateUpdateOptions = {}
): void {
    setState(
        CURRENT_NOTIFICATION_STATE_PATH,
        normalizeRendererNotification(notification),
        {
            source: "rendererNotificationState.set",
            ...options,
        }
    );
}

export function subscribeToCurrentRendererNotification(
    listener: NotificationListener
): () => void {
    return subscribe(CURRENT_NOTIFICATION_STATE_PATH, (notification) => {
        listener(normalizeRendererNotification(notification));
    });
}

export function normalizeRendererNotification(
    value: unknown
): null | RendererNotification {
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
