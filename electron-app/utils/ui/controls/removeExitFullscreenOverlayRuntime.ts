import {
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface RemoveExitFullscreenOverlayRuntimeScope {
    readonly getDocument: (() => Document | undefined) | undefined;
    readonly getHTMLElement:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
}

export interface RemoveExitFullscreenOverlayRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultRemoveExitFullscreenOverlayRuntimeScope: RemoveExitFullscreenOverlayRuntimeScope =
    {
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
    };

function getDocument(scope: RemoveExitFullscreenOverlayRuntimeScope): Document {
    const getRuntimeDocument = scope.getDocument;
    if (typeof getRuntimeDocument !== "function") {
        throw new TypeError(
            "removeExitFullscreenOverlay requires a document provider"
        );
    }

    const runtimeDocument = getRuntimeDocument();
    if (!runtimeDocument) {
        throw new TypeError(
            "removeExitFullscreenOverlay requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: RemoveExitFullscreenOverlayRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    const getRuntimeHTMLElement = scope.getHTMLElement;
    if (typeof getRuntimeHTMLElement !== "function") {
        throw new TypeError(
            "removeExitFullscreenOverlay requires an HTMLElement provider"
        );
    }

    return getRuntimeHTMLElement();
}

export function getRemoveExitFullscreenOverlayRuntime(
    scope: RemoveExitFullscreenOverlayRuntimeScope = defaultRemoveExitFullscreenOverlayRuntimeScope
): RemoveExitFullscreenOverlayRuntime {
    return {
        isHTMLElement(value: unknown): value is HTMLElement {
            getDocument(scope);
            const HTMLElementConstructor = getHTMLElementConstructor(scope);

            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
    };
}
