import { subscribe } from "../state/core/stateManager.js";
import { updateLoadingFromState } from "./loading/syncRendererLoading.js";
import { updateNotificationFromState } from "./notifications/syncRendererNotifications.js";

/**
 * Wires renderer UI helpers to state changes.
 */
export function initializeRendererStateBindings(): void {
    subscribe("isLoading", (loading) => {
        updateLoadingFromState(loading);
    });

    subscribe("ui.currentNotification", (notification) => {
        updateNotificationFromState(notification);
    });

    console.log("[RendererUtils] State management initialized");
}
