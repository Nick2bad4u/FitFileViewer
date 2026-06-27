import { subscribeToRendererLoading } from "../state/domain/rendererLoadingState.js";
import {
    subscribeToCurrentRendererNotification,
    type RendererNotification,
} from "../state/domain/rendererNotificationState.js";
import { updateLoadingFromState } from "./loading/syncRendererLoading.js";
import { updateNotificationFromState } from "./notifications/syncRendererNotifications.js";

type RendererLoadingSubscriber = (
    listener: (loading: boolean) => void
) => unknown;
type RendererNotificationSubscriber = (
    listener: (notification: null | RendererNotification) => void
) => unknown;

export type RendererStateBindingsDependencies = Readonly<{
    logStateInitialized: (message: string) => void;
    subscribeToCurrentRendererNotification: RendererNotificationSubscriber;
    subscribeToRendererLoading: RendererLoadingSubscriber;
    updateLoadingFromState: (loading: boolean) => void;
    updateNotificationFromState: (
        notification: null | RendererNotification
    ) => void;
}>;

const defaultRendererStateBindingsDependencies: RendererStateBindingsDependencies =
    {
        logStateInitialized: (message) => console.log(message),
        subscribeToCurrentRendererNotification,
        subscribeToRendererLoading,
        updateLoadingFromState,
        updateNotificationFromState,
    };

/**
 * Creates the renderer UI state binding initializer from explicit state/UI
 * dependencies.
 */
export function createRendererStateBindings(
    dependencies: RendererStateBindingsDependencies
): () => void {
    return () => {
        dependencies.subscribeToRendererLoading((loading) => {
            dependencies.updateLoadingFromState(loading);
        });

        dependencies.subscribeToCurrentRendererNotification((notification) => {
            dependencies.updateNotificationFromState(notification);
        });

        dependencies.logStateInitialized(
            "[RendererUtils] State management initialized"
        );
    };
}

/**
 * Wires renderer UI helpers to state changes.
 */
export function initializeRendererStateBindings(): void {
    createRendererStateBindings(defaultRendererStateBindingsDependencies)();
}
