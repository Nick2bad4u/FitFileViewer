import { subscribe } from "../../state/core/stateManager.js";
import { updateLoadingFromState } from "../../ui/loading/syncRendererLoading.js";
import { updateNotificationFromState } from "../../ui/notifications/syncRendererNotifications.js";

export {
    isLoading,
    setLoading,
} from "../../ui/loading/syncRendererLoading.js";
export {
    clearNotification,
    getCurrentNotification,
    type NotificationType,
    type RendererNotification,
    showError,
    showInfo,
    showNotification,
    showSuccess,
    showWarning,
} from "../../ui/notifications/syncRendererNotifications.js";

/**
 * Initialize renderer utilities with state management.
 */
export function initializeRendererUtils(): void {
    subscribe("isLoading", (loading) => {
        updateLoadingFromState(loading);
    });

    subscribe("ui.currentNotification", (notification) => {
        updateNotificationFromState(notification);
    });

    console.log("[RendererUtils] State management initialized");
}
