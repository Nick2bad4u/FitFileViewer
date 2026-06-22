import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";

export interface GetActiveTabContentRuntimeScope {
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface GetActiveTabContentRuntime {
    readonly getElementByIdFlexible: (id: string) => HTMLElement | null;
    readonly querySelector: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    readonly queryTabContents: (selector: string) => NodeListOf<HTMLElement>;
}

const defaultGetActiveTabContentRuntimeScope: GetActiveTabContentRuntimeScope =
    {
        getDocument: () => globalThis.document,
    };

function getRequiredDocument(scope: GetActiveTabContentRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("getActiveTabContent requires a document runtime");
    }

    return runtimeDocument;
}

export function getGetActiveTabContentRuntime(
    scope: GetActiveTabContentRuntimeScope = defaultGetActiveTabContentRuntimeScope
): GetActiveTabContentRuntime {
    return {
        getElementByIdFlexible(id): HTMLElement | null {
            return getElementByIdFlexible(getRequiredDocument(scope), id);
        },
        querySelector<TElement extends Element = Element>(
            selector: string
        ): TElement | null {
            return getRequiredDocument(scope).querySelector<TElement>(selector);
        },
        queryTabContents(selector): NodeListOf<HTMLElement> {
            return getRequiredDocument(scope).querySelectorAll<HTMLElement>(
                selector
            );
        },
    };
}
