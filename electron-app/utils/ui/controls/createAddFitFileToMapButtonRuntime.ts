export interface CreateAddFitFileToMapButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface CreateAddFitFileToMapButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const defaultCreateAddFitFileToMapButtonRuntimeScope: CreateAddFitFileToMapButtonRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
    };

function getScopeDocument(
    scope: CreateAddFitFileToMapButtonRuntimeScope
): Document | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getAbortControllerConstructor(
    scope: CreateAddFitFileToMapButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
        scope.AbortController ??
        getScopeDocument(scope)?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createAddFitFileToMapButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreateAddFitFileToMapButtonRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError(
            "createAddFitFileToMapButton requires a document runtime"
        );
    }

    return runtimeDocument;
}

export function getCreateAddFitFileToMapButtonRuntime(
    scope: CreateAddFitFileToMapButtonRuntimeScope = defaultCreateAddFitFileToMapButtonRuntimeScope
): CreateAddFitFileToMapButtonRuntime {
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
    };
}
