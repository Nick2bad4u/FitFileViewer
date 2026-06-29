import {
    type BrowserAbortControllerConstructor,
    type BrowserEventConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserEvent,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export interface CreateMarkerCountSelectorRuntimeScope {
    readonly getAbortController: CreateMarkerCountSelectorRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: CreateMarkerCountSelectorRuntimeProvider<Document>;
    readonly getEvent: CreateMarkerCountSelectorRuntimeProvider<BrowserEventConstructor>;
}

type CreateMarkerCountSelectorRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface CreateMarkerCountSelectorRuntime {
    createAbortController: () => AbortController;
    createChangeEvent: () => Event;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
}

const defaultCreateMarkerCountSelectorRuntimeScope: CreateMarkerCountSelectorRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getEvent: getBrowserEvent,
    };

function getRequiredProvider<T>(
    provider: CreateMarkerCountSelectorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createMarkerCountSelector requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreateMarkerCountSelectorRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreateMarkerCountSelectorRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError(
            "createMarkerCountSelector requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getEventConstructor(
    scope: CreateMarkerCountSelectorRuntimeScope
): BrowserEventConstructor {
    const EventConstructor = getRequiredProvider(scope.getEvent, "Event")();
    if (typeof EventConstructor !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an Event runtime"
        );
    }

    return EventConstructor;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: CreateMarkerCountSelectorRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getCreateMarkerCountSelectorRuntime(
    scope: CreateMarkerCountSelectorRuntimeScope = defaultCreateMarkerCountSelectorRuntimeScope
): CreateMarkerCountSelectorRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createChangeEvent(): Event {
            const EventConstructor = getEventConstructor(scope);
            return new EventConstructor("change", {
                bubbles: false,
                cancelable: true,
                composed: false,
            });
        },
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
