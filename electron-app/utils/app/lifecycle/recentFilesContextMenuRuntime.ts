export interface RecentFilesContextMenuRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly getViewport?:
        | (() => RecentFilesContextMenuViewportSource | undefined)
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
    readonly viewport?: RecentFilesContextMenuViewportSource | undefined;
}

export type RecentFilesContextMenuTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface RecentFilesContextMenuViewport {
    readonly height: number;
    readonly width: number;
}

export interface RecentFilesContextMenuViewportSource {
    readonly height?: number | undefined;
    readonly width?: number | undefined;
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

const defaultRecentFilesContextMenuRuntimeScope: RecentFilesContextMenuRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getClearTimeout: () => globalThis.clearTimeout,
        getSetTimeout: () => globalThis.setTimeout,
        getViewport: () => ({
            height: globalThis.innerHeight,
            width: globalThis.innerWidth,
        }),
    };

function getAbortController(
    scope: RecentFilesContextMenuRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getClearTimeout(
    scope: RecentFilesContextMenuRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getSetTimeout(
    scope: RecentFilesContextMenuRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

function getViewport(
    scope: RecentFilesContextMenuRuntimeScope
): RecentFilesContextMenuViewportSource | undefined {
    return scope.getViewport?.() ?? scope.viewport;
}

export function getRecentFilesContextMenuRuntime(
    scope: RecentFilesContextMenuRuntimeScope = defaultRecentFilesContextMenuRuntimeScope
): RecentFilesContextMenuRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = getClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "recent files context menu requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "recent files context menu requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getViewport(): RecentFilesContextMenuViewport {
            const viewport = getViewport(scope);

            return {
                height: normalizeDimension(viewport?.height),
                width: normalizeDimension(viewport?.width),
            };
        },
        setTimeout(callback, delayMs): RecentFilesContextMenuTimer {
            const setTimeoutRef = getSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "recent files context menu requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
