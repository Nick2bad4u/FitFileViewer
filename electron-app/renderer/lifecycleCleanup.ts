import type { RendererErrorEventHandlers } from "./errorHandling.js";
import type { RendererRemoveEventListener } from "./runtimeEnvironment.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";
import type { AppActions } from "../utils/app/lifecycle/appActions.js";
import type { MasterStateManager } from "../utils/state/core/masterStateManager.js";

type RendererCleanupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

interface RendererLifecycleCleanupOptions {
    appActions: RendererCleanupAppActions;
    errorHandlers: Pick<
        RendererErrorEventHandlers,
        "onUncaughtErrorEvent" | "onUnhandledRejectionEvent"
    >;
    isOpeningFileRef: RendererFileOpeningStateRef;
    logRenderer: RendererCleanupLogger;
    masterStateManager: RendererCleanupMasterStateManager;
    removeEventListener: RendererRemoveEventListener;
}

type RendererCleanupAppActions = {
    readonly setFileOpening: typeof AppActions.setFileOpening;
    readonly setInitialized: typeof AppActions.setInitialized;
};

type RendererCleanupMasterStateManager = {
    readonly cleanup: MasterStateManager["cleanup"];
    readonly isInitialized: MasterStateManager["isInitialized"];
};

export function createRendererLifecycleCleanup(
    options: RendererLifecycleCleanupOptions
): () => void {
    return function cleanup(): void {
        try {
            options.logRenderer("log", "[Renderer] Performing cleanup...");
            removeRendererErrorEventListeners(options);
            void cleanupRendererStateManagerState(options);
            options.logRenderer("log", "[Renderer] Cleanup completed");
        } catch (error) {
            options.logRenderer("error", "[Renderer] Cleanup failed:", error);
        }
    };
}

export async function cleanupRendererStateManagerState(
    options: RendererLifecycleCleanupOptions
): Promise<void> {
    try {
        options.appActions.setInitialized(false);
        options.appActions.setFileOpening(false);

        if (options.masterStateManager.isInitialized) {
            options.masterStateManager.cleanup();
            return;
        }

        resetRendererOpeningState(options);
    } catch {
        resetRendererOpeningState(options);
    }
}

export function resetRendererOpeningState(
    options: Pick<RendererLifecycleCleanupOptions, "isOpeningFileRef">
): void {
    options.isOpeningFileRef.value = false;
}

function removeRendererErrorEventListeners(
    options: RendererLifecycleCleanupOptions
): void {
    options.removeEventListener(
        "unhandledrejection",
        options.errorHandlers.onUnhandledRejectionEvent
    );
    options.removeEventListener(
        "error",
        options.errorHandlers.onUncaughtErrorEvent
    );
}
