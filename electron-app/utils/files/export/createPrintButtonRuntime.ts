export interface CreatePrintButtonRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getPrint?: (() => (() => void) | undefined) | undefined;
}

export interface CreatePrintButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    print: () => void;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function getDocument(scope: CreatePrintButtonRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("createPrintButton requires a document runtime");
    }

    return runtimeDocument;
}

const defaultCreatePrintButtonRuntimeScope: CreatePrintButtonRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getDocument: () => globalThis.document,
    getPrint: () => globalThis.print,
};

export function getCreatePrintButtonRuntime(
    scope: CreatePrintButtonRuntimeScope = defaultCreatePrintButtonRuntimeScope
): CreatePrintButtonRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createPrintButton requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
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
        print(): void {
            scope.getPrint?.()?.();
        },
    };
}
