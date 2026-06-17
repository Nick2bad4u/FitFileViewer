export interface LoadingOverlayRuntimeScope {
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface LoadingOverlayRuntime {
    appendToBody: (element: Readonly<HTMLElement>) => void;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    querySelector: <E extends Element = Element>(selector: string) => E | null;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const defaultLoadingOverlayRuntimeScope: LoadingOverlayRuntimeScope = {
    getDocument: () => globalThis.document,
};

function getDocument(scope: LoadingOverlayRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("LoadingOverlay requires a document runtime");
    }

    return runtimeDocument;
}

export function getLoadingOverlayRuntime(
    scope: LoadingOverlayRuntimeScope = defaultLoadingOverlayRuntimeScope
): LoadingOverlayRuntime {
    return {
        appendToBody(element: Readonly<HTMLElement>): void {
            getDocument(scope).body.append(element);
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
        querySelector<E extends Element = Element>(selector: string): E | null {
            return getDocument(scope).querySelector<E>(selector);
        },
    };
}
