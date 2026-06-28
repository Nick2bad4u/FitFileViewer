import {
    getState,
    setState,
    subscribe,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export {
    isNotificationType,
    normalizeRendererNotification,
    type NotificationType,
    type RendererNotification,
} from "./rendererNotificationContract.js";
import {
    normalizeRendererNotification,
    type NotificationType,
    type RendererNotification,
} from "./rendererNotificationContract.js";

const CURRENT_NOTIFICATION_STATE_PATH = "ui.currentNotification";
const LAST_NOTIFICATION_STATE_PATH = "ui.lastNotification";

type NotificationListener = (notification: null | RendererNotification) => void;

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

export function getLastRendererNotification(): null | RendererNotification {
    return normalizeRendererNotification(getState(LAST_NOTIFICATION_STATE_PATH));
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

export function setLastRendererNotification(
    notification: {
        message: string;
        timestamp: number;
        type: NotificationType;
    },
    options: StateUpdateOptions = {}
): void {
    setState(
        LAST_NOTIFICATION_STATE_PATH,
        normalizeRendererNotification(notification),
        {
            source: "rendererNotificationState.setLast",
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
