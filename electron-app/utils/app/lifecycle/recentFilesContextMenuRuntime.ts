export interface RecentFilesContextMenuRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
    readonly window?:
        | {
              readonly innerHeight?: number | undefined;
              readonly innerWidth?: number | undefined;
          }
        | undefined;
}

export type RecentFilesContextMenuTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface RecentFilesContextMenuViewport {
    readonly height: number;
    readonly width: number;
}

export interface RecentFilesContextMenuRuntime {
    clearTimeout: (handle: RecentFilesContextMenuTimer) => void;
    getViewport: () => RecentFilesContextMenuViewport;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => RecentFilesContextMenuTimer;
}

function normalizeDimension(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function getRecentFilesContextMenuRuntime(
    scope: RecentFilesContextMenuRuntimeScope = globalThis
): RecentFilesContextMenuRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        getViewport(): RecentFilesContextMenuViewport {
            return {
                height: normalizeDimension(scope.window?.innerHeight),
                width: normalizeDimension(scope.window?.innerWidth),
            };
        },
        setTimeout(callback, delayMs): RecentFilesContextMenuTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
