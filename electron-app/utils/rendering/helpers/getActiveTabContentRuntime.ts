import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { getBrowserDocument } from "../../runtime/browserRuntime.js";

export interface GetActiveTabContentRuntimeScope {
    readonly getDocument: GetActiveTabContentRuntimeProvider<Document>;
}

export interface GetActiveTabContentRuntime {
    readonly getElementByIdFlexible: (id: string) => HTMLElement | null;
    readonly querySelector: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    readonly queryTabContents: (selector: string) => NodeListOf<HTMLElement>;
}

type GetActiveTabContentRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultGetActiveTabContentRuntimeScope: GetActiveTabContentRuntimeScope =
    {
        getDocument: getBrowserDocument,
    };

function getRequiredDocument(
    getDocument: () => Document | undefined
): Document {
    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("getActiveTabContent requires a document runtime");
    }

    return runtimeDocument;
}

export function getGetActiveTabContentRuntime(
    scope: GetActiveTabContentRuntimeScope = defaultGetActiveTabContentRuntimeScope
): GetActiveTabContentRuntime {
    const getDocument = getRequiredProvider(scope.getDocument, "document");

    return {
        getElementByIdFlexible(id): HTMLElement | null {
            return getElementByIdFlexible(getRequiredDocument(getDocument), id);
        },
        querySelector<TElement extends Element = Element>(
            selector: string
        ): TElement | null {
            return getRequiredDocument(getDocument).querySelector<TElement>(
                selector
            );
        },
        queryTabContents(selector): NodeListOf<HTMLElement> {
            return getRequiredDocument(
                getDocument
            ).querySelectorAll<HTMLElement>(selector);
        },
    };
}

function getRequiredProvider<T>(
    provider: GetActiveTabContentRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `getActiveTabContent requires a ${providerName} provider`
        );
    }

    return provider;
}
