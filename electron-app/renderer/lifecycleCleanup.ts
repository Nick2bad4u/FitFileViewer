import type { RendererErrorEventHandlers } from "./errorHandling.js";
import type { RendererRemoveEventListener } from "./runtimeEnvironment.js";

type RendererCleanupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

interface RendererCleanupCoreModules {
    AppActions: unknown;
    masterStateManager: unknown;
}

interface RendererLifecycleCleanupOptions {
    errorHandlers: Pick<
        RendererErrorEventHandlers,
        "onUncaughtErrorEvent" | "onUnhandledRejectionEvent"
    >;
    getCoreModules: () => Promise<RendererCleanupCoreModules>;
    isOpeningFileRef: { value: boolean };
    logRenderer: RendererCleanupLogger;
    removeEventListener: RendererRemoveEventListener;
}

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
        const appActions = toRecord(AppActions);
        callBooleanAppAction(appActions, "setInitialized", false);
        callBooleanAppAction(appActions, "setFileOpening", false);

        const masterStateManagerRecord = toRecord(masterStateManager);
        if (masterStateManagerRecord["isInitialized"] === true) {
            const cleanupStateManager = masterStateManagerRecord["cleanup"];
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

function callBooleanAppAction(
    appActions: Record<string, unknown>,
    actionName: "setFileOpening" | "setInitialized",
    value: boolean
): void {
    const action = appActions[actionName];
    if (typeof action === "function") {
        const actionFn = action as (value: boolean) => unknown;
        actionFn(value);
    }
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

function toRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}
