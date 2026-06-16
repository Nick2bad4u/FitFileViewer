export interface AddExitFullscreenOverlayRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface AddExitFullscreenOverlayRuntime {
    createAbortController: () => AbortController;
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

const defaultAddExitFullscreenOverlayRuntimeScope: AddExitFullscreenOverlayRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
    };

function getScopeDocument(
    scope: AddExitFullscreenOverlayRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getAbortControllerConstructor(
    scope: AddExitFullscreenOverlayRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
        getScopeDocument(scope)?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "addExitFullscreenOverlay requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: AddExitFullscreenOverlayRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError(
            "addExitFullscreenOverlay requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    runtimeDocument: Readonly<Document>
): typeof HTMLElement | undefined {
    return runtimeDocument.defaultView?.HTMLElement;
}

export function getAddExitFullscreenOverlayRuntime(
    scope: AddExitFullscreenOverlayRuntimeScope = defaultAddExitFullscreenOverlayRuntimeScope
): AddExitFullscreenOverlayRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
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
            return getDocument(scope).createElementNS(SVG_NAMESPACE, tagName);
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
