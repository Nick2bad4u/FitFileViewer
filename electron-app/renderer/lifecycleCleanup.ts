import type { RendererErrorEventHandlers } from "./errorHandling.js";
import type { RendererRemoveEventListener } from "./runtimeEnvironment.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";
import type { AppActions } from "../utils/app/lifecycle/appActions.js";

type RendererCleanupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

interface RendererCleanupCoreModules {
    AppActions: RendererCleanupAppActions | undefined;
    masterStateManager: unknown;
}

interface RendererLifecycleCleanupOptions {
    errorHandlers: Pick<
        RendererErrorEventHandlers,
        "onUncaughtErrorEvent" | "onUnhandledRejectionEvent"
    >;
    getCoreModules: () => Promise<RendererCleanupCoreModules>;
    isOpeningFileRef: RendererFileOpeningStateRef;
    logRenderer: RendererCleanupLogger;
    removeEventListener: RendererRemoveEventListener;
}

type RendererCleanupAppActions = {
    readonly setFileOpening: typeof AppActions.setFileOpening;
    readonly setInitialized: typeof AppActions.setInitialized;
};

type RendererCleanupMasterStateManager = {
    readonly cleanup?: unknown;
    readonly isInitialized?: unknown;
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
        const { AppActions, masterStateManager } =
            await options.getCoreModules();
        AppActions?.setInitialized?.(false);
        AppActions?.setFileOpening?.(false);

        const masterStateManagerRecord =
            toCleanupMasterStateManager(masterStateManager);
        if (masterStateManagerRecord.isInitialized === true) {
            const cleanupStateManager = masterStateManagerRecord.cleanup;
            if (typeof cleanupStateManager === "function") {
                const cleanupStateManagerFn = cleanupStateManager as (
                    this: unknown
                ) => unknown;
                cleanupStateManagerFn.call(masterStateManager);
            }
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

function toCleanupMasterStateManager(
    value: unknown
): RendererCleanupMasterStateManager {
    return typeof value === "object" && value !== null ? value : {};
}
