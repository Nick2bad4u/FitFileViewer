import {
    type BrowserAbortControllerConstructor,
    type BrowserEventConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserEvent,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export interface CreateMarkerCountSelectorRuntimeScope {
    readonly getAbortController:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDocument: (() => Document | undefined) | undefined;
    readonly getEvent: (() => BrowserEventConstructor | undefined) | undefined;
}

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

function getScopeDocument(
    scope: CreateMarkerCountSelectorRuntimeScope
): Document | undefined {
    const getRuntimeDocument = scope.getDocument;
    if (typeof getRuntimeDocument !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires a document provider"
        );
    }

    return getRuntimeDocument();
}

function getAbortControllerConstructor(
    scope: CreateMarkerCountSelectorRuntimeScope
): BrowserAbortControllerConstructor {
    const getRuntimeAbortController = scope.getAbortController;
    if (typeof getRuntimeAbortController !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an AbortController provider"
        );
    }

    const AbortControllerConstructor = getRuntimeAbortController();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreateMarkerCountSelectorRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
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
    const getRuntimeEvent = scope.getEvent;
    if (typeof getRuntimeEvent !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an Event provider"
        );
    }

    const EventConstructor = getRuntimeEvent();
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
