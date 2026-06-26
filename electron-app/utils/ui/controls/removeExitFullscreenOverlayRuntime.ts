import {
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

export interface RemoveExitFullscreenOverlayRuntimeScope {
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface RemoveExitFullscreenOverlayRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultRemoveExitFullscreenOverlayRuntimeScope: RemoveExitFullscreenOverlayRuntimeScope =
    {
        getDocument: getBrowserDocument,
    };

function getDocument(scope: RemoveExitFullscreenOverlayRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "removeExitFullscreenOverlay requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    runtimeDocument: Readonly<Document>
): BrowserHTMLElementConstructor | undefined {
    return runtimeDocument.defaultView?.HTMLElement;
}

export function getRemoveExitFullscreenOverlayRuntime(
    scope: RemoveExitFullscreenOverlayRuntimeScope = defaultRemoveExitFullscreenOverlayRuntimeScope
): RemoveExitFullscreenOverlayRuntime {
    return {
        isHTMLElement(value: unknown): value is HTMLElement {
            const runtimeDocument = getDocument(scope);
            const HTMLElementConstructor =
                getHTMLElementConstructor(runtimeDocument);

            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
    };
}
