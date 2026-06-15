type BrowserWindowOpen = (
    url?: string | URL,
    target?: string,
    features?: string
) => WindowProxy | null;

export interface ExternalLinkHandlersRuntimeScope {
    readonly getOpen?: (() => BrowserWindowOpen | undefined) | undefined;
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
        getOpen: () => globalThis.open,
    };

function getBrowserWindowOpen(
    scope: ExternalLinkHandlersRuntimeScope
): BrowserWindowOpen | undefined {
    return scope.getOpen?.() ?? scope.open;
}

export function getExternalLinkHandlersRuntime(
    scope: ExternalLinkHandlersRuntimeScope = defaultExternalLinkHandlersRuntimeScope
): ExternalLinkHandlersRuntime {
    return {
        openBrowserWindow(url, target, features): WindowProxy | null {
            const open = getBrowserWindowOpen(scope);
            if (typeof open !== "function") {
                return null;
            }

            return open(url, target, features);
        },
    };
}
