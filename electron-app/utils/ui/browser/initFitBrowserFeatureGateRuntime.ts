import {
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

const BROWSER_TAB_BUTTON_ID = "tab_browser";
const BROWSER_TAB_CONTENT_ID = "content_browser";

type BrowserTabFeatureGateDocument = Readonly<Pick<Document, "querySelector">>;
type BrowserTabFeatureGateVisibleElement = Readonly<Pick<HTMLElement, "style">>;

export interface BrowserTabFeatureGateElements {
    readonly content: BrowserTabFeatureGateVisibleElement | null;
    readonly tabButton: BrowserTabFeatureGateVisibleElement | null;
}

export interface FitBrowserFeatureGateRuntimeScope {
    readonly getDocument:
        | (() => BrowserTabFeatureGateDocument | undefined)
        | undefined;
    readonly getHTMLElement:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
}

export interface FitBrowserFeatureGateRuntime {
    getBrowserTabElements: () => BrowserTabFeatureGateElements;
    setElementVisible: (
        element: BrowserTabFeatureGateVisibleElement | null,
        visible: boolean
    ) => void;
}

const defaultFitBrowserFeatureGateRuntimeScope: FitBrowserFeatureGateRuntimeScope =
    {
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
    };

function getHTMLElementConstructor(
    scope: FitBrowserFeatureGateRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    const getHTMLElement = scope.getHTMLElement;
    if (typeof getHTMLElement !== "function") {
        throw new TypeError(
            "fitBrowserFeatureGate requires an HTMLElement provider"
        );
    }

    return getHTMLElement();
}

function getRuntimeDocument(
    scope: FitBrowserFeatureGateRuntimeScope
): BrowserTabFeatureGateDocument | undefined {
    const getDocument = scope.getDocument;
    if (typeof getDocument !== "function") {
        throw new TypeError(
            "fitBrowserFeatureGate requires a document provider"
        );
    }

    return getDocument();
}

function getElementById(
    scope: FitBrowserFeatureGateRuntimeScope,
    id: string
): BrowserTabFeatureGateVisibleElement | null {
    const runtimeDocument = getRuntimeDocument(scope);
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
        setElementVisible(
            element: BrowserTabFeatureGateVisibleElement | null,
            visible: boolean
        ): void {
            if (element) {
                element.style.display = visible ? "" : "none";
            }
        },
    };
}
