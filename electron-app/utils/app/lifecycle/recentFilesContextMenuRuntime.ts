export interface RecentFilesContextMenuRuntimeScope {
    readonly window?:
        | {
              readonly innerHeight?: number | undefined;
              readonly innerWidth?: number | undefined;
          }
        | undefined;
}

export interface RecentFilesContextMenuViewport {
    readonly height: number;
    readonly width: number;
}

export interface RecentFilesContextMenuRuntime {
    getViewport: () => RecentFilesContextMenuViewport;
}

function normalizeDimension(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function getRecentFilesContextMenuRuntime(
    scope: RecentFilesContextMenuRuntimeScope = globalThis
): RecentFilesContextMenuRuntime {
    return {
        getViewport(): RecentFilesContextMenuViewport {
            return {
                height: normalizeDimension(scope.window?.innerHeight),
                width: normalizeDimension(scope.window?.innerWidth),
            };
        },
    };
}
