const BROWSER_TAB_BUTTON_ID = "tab_browser";
const BROWSER_TAB_CONTENT_ID = "content_browser";

export interface BrowserTabFeatureGateElements {
    readonly content: HTMLElement | null;
    readonly tabButton: HTMLElement | null;
}

export interface FitBrowserFeatureGateRuntimeScope {
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
}

export interface FitBrowserFeatureGateRuntime {
    getBrowserTabElements: () => BrowserTabFeatureGateElements;
    setElementVisible: (element: HTMLElement | null, visible: boolean) => void;
}

const defaultFitBrowserFeatureGateRuntimeScope: FitBrowserFeatureGateRuntimeScope =
    globalThis;

function getHTMLElementConstructor(
    scope: FitBrowserFeatureGateRuntimeScope
): typeof HTMLElement | undefined {
    return scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
}

function getElementById(
    scope: FitBrowserFeatureGateRuntimeScope,
    id: string
): HTMLElement | null {
    const runtimeDocument = scope.document;
    const HTMLElementConstructor = getHTMLElementConstructor(scope);
    if (!runtimeDocument || typeof HTMLElementConstructor !== "function") {
        return null;
    }

    const element = runtimeDocument.querySelector(`#${id}`);
    return element instanceof HTMLElementConstructor ? element : null;
}

export function getFitBrowserFeatureGateRuntime(
    scope: FitBrowserFeatureGateRuntimeScope = defaultFitBrowserFeatureGateRuntimeScope
): FitBrowserFeatureGateRuntime {
    return {
        getBrowserTabElements(): BrowserTabFeatureGateElements {
            return {
                content: getElementById(scope, BROWSER_TAB_CONTENT_ID),
                tabButton: getElementById(scope, BROWSER_TAB_BUTTON_ID),
            };
        },
        setElementVisible(element: HTMLElement | null, visible: boolean): void {
            if (element) {
                element.style.display = visible ? "" : "none";
            }
        },
    };
}
