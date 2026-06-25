import { getBrowserDocument } from "../../runtime/browserRuntime.js";

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

type IconFactoryDocument = Pick<Document, "createElementNS">;

export type IconFactoryRuntimeScope = {
    readonly getDocument?: (() => IconFactoryDocument | undefined) | undefined;
};

export type IconFactoryRuntime = {
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
};

const defaultIconFactoryRuntimeScope: IconFactoryRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getRequiredDocument(
    scope: IconFactoryRuntimeScope
): IconFactoryDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("icon factory requires a document runtime");
    }
    return runtimeDocument;
}

export function getIconFactoryRuntime(
    scope: IconFactoryRuntimeScope = defaultIconFactoryRuntimeScope
): IconFactoryRuntime {
    return {
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return getRequiredDocument(scope).createElementNS(
                SVG_NAMESPACE,
                tagName
            );
        },
    };
}
