export interface RemoveExitFullscreenOverlayRuntimeScope {
    readonly document?: Document | undefined;
}

export interface RemoveExitFullscreenOverlayRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

function getDocument(scope: RemoveExitFullscreenOverlayRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "removeExitFullscreenOverlay requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    runtimeDocument: Document
): typeof HTMLElement | undefined {
    return runtimeDocument.defaultView?.HTMLElement ?? globalThis.HTMLElement;
}

export function getRemoveExitFullscreenOverlayRuntime(
    scope: RemoveExitFullscreenOverlayRuntimeScope = globalThis
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
