import {
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserEvent,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export interface CreateMarkerCountSelectorRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getEvent?: (() => typeof Event | undefined) | undefined;
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
    return scope.getDocument?.();
}

function getAbortControllerConstructor(
    scope: CreateMarkerCountSelectorRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
        getScopeDocument(scope)?.defaultView?.AbortController;
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
): typeof Event {
    const EventConstructor =
        scope.getEvent?.() ?? getScopeDocument(scope)?.defaultView?.Event;
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
