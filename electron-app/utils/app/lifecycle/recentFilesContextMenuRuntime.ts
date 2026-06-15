export interface RecentFilesContextMenuRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
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
    createAbortController: () => AbortController;
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
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "recent files context menu requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "recent files context menu requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getViewport(): RecentFilesContextMenuViewport {
            return {
                height: normalizeDimension(scope.window?.innerHeight),
                width: normalizeDimension(scope.window?.innerWidth),
            };
        },
        setTimeout(callback, delayMs): RecentFilesContextMenuTimer {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "recent files context menu requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
