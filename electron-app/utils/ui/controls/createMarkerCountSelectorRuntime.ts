export interface CreateMarkerCountSelectorRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly Event?: typeof Event | undefined;
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

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const defaultCreateMarkerCountSelectorRuntimeScope: CreateMarkerCountSelectorRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
        getEvent: () => globalThis.Event,
    };

function getScopeDocument(
    scope: CreateMarkerCountSelectorRuntimeScope
): Document | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getAbortControllerConstructor(
    scope: CreateMarkerCountSelectorRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
        scope.AbortController ??
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
        scope.getEvent?.() ??
        scope.Event ??
        getScopeDocument(scope)?.defaultView?.Event;
    if (typeof EventConstructor !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an Event runtime"
        );
    }

    return EventConstructor;
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
            return getDocument(scope).createElementNS(SVG_NAMESPACE, tagName);
        },
    };
}
