type BrowserWindowOpen = (
    url?: string | URL,
    target?: string,
    features?: string
) => WindowProxy | null;

export interface ExternalLinkHandlersRuntimeScope {
    readonly open?: BrowserWindowOpen | undefined;
}

export interface ExternalLinkHandlersRuntime {
    openBrowserWindow: (
        url: string,
        target: string,
        features: string
    ) => WindowProxy | null;
}

const defaultExternalLinkHandlersRuntimeScope: ExternalLinkHandlersRuntimeScope =
    {
        get open(): BrowserWindowOpen | undefined {
            return globalThis.open;
        },
    };

export function getExternalLinkHandlersRuntime(
    scope: ExternalLinkHandlersRuntimeScope = defaultExternalLinkHandlersRuntimeScope
): ExternalLinkHandlersRuntime {
    return {
        openBrowserWindow(url, target, features): WindowProxy | null {
            if (typeof scope.open !== "function") {
                return null;
            }

            return scope.open(url, target, features);
        },
    };
}
