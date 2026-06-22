export interface DataPointFilterElementFactoryRuntimeScope {
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface DataPointFilterElementFactoryRuntime {
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function getDocument(
    scope: DataPointFilterElementFactoryRuntimeScope
): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "data point filter element factory requires a document runtime"
        );
    }

    return runtimeDocument;
}

const defaultDataPointFilterElementFactoryRuntimeScope: DataPointFilterElementFactoryRuntimeScope =
    {
        getDocument: () => globalThis.document,
    };

export function getDataPointFilterElementFactoryRuntime(
    scope: DataPointFilterElementFactoryRuntimeScope = defaultDataPointFilterElementFactoryRuntimeScope
): DataPointFilterElementFactoryRuntime {
    return {
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
