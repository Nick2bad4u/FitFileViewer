export interface CreatePrintButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly print?: (() => void) | undefined;
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
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("createPrintButton requires a document runtime");
    }

    return runtimeDocument;
}

export function getCreatePrintButtonRuntime(
    scope: CreatePrintButtonRuntimeScope = globalThis
): CreatePrintButtonRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
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
            scope.print?.();
        },
    };
}
