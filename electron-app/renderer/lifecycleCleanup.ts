import type { RendererErrorEventHandlers } from "./errorHandling.js";

type RendererCleanupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

interface RendererCleanupCoreModules {
    AppActions: unknown;
    masterStateManager: unknown;
}

export interface RendererLifecycleAppState {
    isInitialized: boolean;
    isOpeningFile: boolean;
    startTime: number | undefined;
}

interface RendererLifecycleCleanupOptions {
    errorHandlers: Pick<
        RendererErrorEventHandlers,
        "onUncaughtErrorEvent" | "onUnhandledRejectionEvent"
    >;
    getAppState: () => null | RendererLifecycleAppState;
    getCoreModules: () => Promise<RendererCleanupCoreModules>;
    isOpeningFileRef: { value: boolean };
    logRenderer: RendererCleanupLogger;
    removeEventListener: typeof globalThis.removeEventListener;
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
        const masterStateManagerRecord = toRecord(masterStateManager);
        if (masterStateManagerRecord["isInitialized"] === true) {
            const appActions = toRecord(AppActions);
            callBooleanAppAction(appActions, "setInitialized", false);
            callBooleanAppAction(appActions, "setFileOpening", false);

            const cleanupStateManager = masterStateManagerRecord["cleanup"];
            if (typeof cleanupStateManager === "function") {
                const cleanupStateManagerFn = cleanupStateManager as (
                    this: unknown
                ) => unknown;
                cleanupStateManagerFn.call(masterStateManager);
            }
            return;
        }

        resetRendererLegacyOpeningState(options);
    } catch {
        resetRendererLegacyOpeningState(options);
    }
}

export function resetRendererLegacyOpeningState(
    options: Pick<
        RendererLifecycleCleanupOptions,
        "getAppState" | "isOpeningFileRef"
    >
): void {
    const appState = options.getAppState();
    if (appState !== null) {
        appState.isInitialized = false;
        appState.isOpeningFile = false;
    }
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
