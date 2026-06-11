import { subscribe } from "../state/core/stateManager.js";
import { subscribeToCurrentRendererNotification } from "../state/domain/rendererNotificationState.js";
import { updateLoadingFromState } from "./loading/syncRendererLoading.js";
import { updateNotificationFromState } from "./notifications/syncRendererNotifications.js";

/**
 * Wires renderer UI helpers to state changes.
 */
export function initializeRendererStateBindings(): void {
    subscribe("isLoading", (loading) => {
        updateLoadingFromState(loading);
    });

    subscribeToCurrentRendererNotification((notification) => {
        updateNotificationFromState(notification);
    });

    console.log("[RendererUtils] State management initialized");
}
