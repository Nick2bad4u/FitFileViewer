import { getBrowserDocument } from "../../../runtime/browserRuntime.js";
import { getIconFactoryRuntime } from "../../icons/iconFactoryRuntime.js";

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
        getDocument: getBrowserDocument,
    };

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: DataPointFilterElementFactoryRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

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
            return createSvgElement(scope, tagName);
        },
    };
}
