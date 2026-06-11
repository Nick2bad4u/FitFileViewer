export interface AddExitFullscreenOverlayRuntimeScope {
    readonly document?: Document | undefined;
}

export interface AddExitFullscreenOverlayRuntime {
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    exitFullscreen: () => Promise<void>;
    getFullscreenElement: () => Element | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function getDocument(scope: AddExitFullscreenOverlayRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "addExitFullscreenOverlay requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    runtimeDocument: Document
): typeof HTMLElement | undefined {
    return runtimeDocument.defaultView?.HTMLElement ?? globalThis.HTMLElement;
}

export function getAddExitFullscreenOverlayRuntime(
    scope: AddExitFullscreenOverlayRuntimeScope = globalThis
): AddExitFullscreenOverlayRuntime {
    return {
        createButton(): HTMLButtonElement {
            return getDocument(scope).createElement("button");
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return getDocument(scope).createElementNS(
                SVG_NAMESPACE,
                tagName
            );
        },
        async exitFullscreen(): Promise<void> {
            await getDocument(scope).exitFullscreen();
        },
        getFullscreenElement(): Element | null {
            return getDocument(scope).fullscreenElement;
        },
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
