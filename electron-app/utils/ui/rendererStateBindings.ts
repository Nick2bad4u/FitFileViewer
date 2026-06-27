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
type StateUnsubscribe = () => void;

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
): () => StateUnsubscribe {
    return () => {
        const unsubscribes: StateUnsubscribe[] = [];

        trackRendererBindingSubscription(
            dependencies.subscribeToRendererLoading((loading) => {
                dependencies.updateLoadingFromState(loading);
            }),
            unsubscribes
        );

        trackRendererBindingSubscription(
            dependencies.subscribeToCurrentRendererNotification(
                (notification) => {
                    dependencies.updateNotificationFromState(notification);
                }
            ),
            unsubscribes
        );

        dependencies.logStateInitialized(
            "[RendererUtils] State management initialized"
        );

        return () => {
            cleanupRendererBindingSubscriptions(unsubscribes);
        };
    };
}

let cleanupCurrentRendererStateBindings: StateUnsubscribe | null = null;

/**
 * Wires renderer UI helpers to state changes.
 */
export function initializeRendererStateBindings(): void {
    cleanupRendererStateBindings();
    cleanupCurrentRendererStateBindings = createRendererStateBindings(
        defaultRendererStateBindingsDependencies
    )();
}

/**
 * Removes renderer UI helper state subscriptions.
 */
export function cleanupRendererStateBindings(): void {
    if (cleanupCurrentRendererStateBindings === null) {
        return;
    }

    try {
        cleanupCurrentRendererStateBindings();
    } catch {
        /* Ignore cleanup errors. */
    }
    cleanupCurrentRendererStateBindings = null;
}

function trackRendererBindingSubscription(
    subscription: unknown,
    unsubscribes: StateUnsubscribe[]
): void {
    if (typeof subscription === "function") {
        unsubscribes.push(() => {
            subscription();
        });
    }
}

function cleanupRendererBindingSubscriptions(
    unsubscribes: StateUnsubscribe[]
): void {
    for (const unsubscribe of unsubscribes.splice(0)) {
        try {
            unsubscribe();
        } catch {
            /* Ignore cleanup errors. */
        }
    }
}
