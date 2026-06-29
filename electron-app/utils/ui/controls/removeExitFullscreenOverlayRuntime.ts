import {
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface RemoveExitFullscreenOverlayRuntimeScope {
    readonly getDocument: RemoveExitFullscreenOverlayRuntimeProvider<Document>;
    readonly getHTMLElement: RemoveExitFullscreenOverlayRuntimeProvider<BrowserHTMLElementConstructor>;
}

type RemoveExitFullscreenOverlayRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface RemoveExitFullscreenOverlayRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultRemoveExitFullscreenOverlayRuntimeScope: RemoveExitFullscreenOverlayRuntimeScope =
    {
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
    };

function getDocument(scope: RemoveExitFullscreenOverlayRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
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
    return getRequiredProvider(scope.getHTMLElement, "HTMLElement")();
}

function getRequiredProvider<T>(
    provider: RemoveExitFullscreenOverlayRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `removeExitFullscreenOverlay requires ${article} ${providerName} provider`
        );
    }

    return provider;
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
