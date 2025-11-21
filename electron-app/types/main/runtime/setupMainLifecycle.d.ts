export type AppLike = {
    whenReady?: () => Promise<unknown>;
};
export type WindowLike = {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
    };
};
export type LifecycleDependencies = {
    appRef: () => AppLike | undefined;
    browserWindowRef: () =>
        | {
              getAllWindows?: () => WindowLike[];
          }
        | undefined;
    getAppState: (key: string) => unknown;
    initializeApplication: () => Promise<WindowLike | undefined> | WindowLike | undefined;
    setupApplicationEventHandlers: () => void;
    setupIPCHandlers: (win: WindowLike | undefined) => void;
    setupMenuAndEventHandlers: () => void;
    exposeDevHelpers: () => void;
    logWithContext: (
        level: "info" | "warn" | "error" | string,
        message: string,
        context?: Record<string, unknown>
    ) => void;
};
/**
 * Registers the full main-process lifecycle, including test fallbacks that eagerly initialize the
 * window and IPC wiring.
 *
 * @param {LifecycleDependencies} deps
 * @returns {void}
 */
export function setupMainLifecycle(deps: LifecycleDependencies): void;
//# sourceMappingURL=setupMainLifecycle.d.ts.map
