export interface CreateAddFitFileToMapButtonRuntimeScope {
    readonly document?: Document | undefined;
}

export interface CreateAddFitFileToMapButtonRuntime {
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function getDocument(
    scope: CreateAddFitFileToMapButtonRuntimeScope
): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "createAddFitFileToMapButton requires a document runtime"
        );
    }

    return runtimeDocument;
}

export function getCreateAddFitFileToMapButtonRuntime(
    scope: CreateAddFitFileToMapButtonRuntimeScope = globalThis
): CreateAddFitFileToMapButtonRuntime {
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
    };
}
