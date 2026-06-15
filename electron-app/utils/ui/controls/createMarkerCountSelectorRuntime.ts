export interface CreateMarkerCountSelectorRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly Event?: typeof Event | undefined;
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
        get AbortController() {
            return globalThis.AbortController;
        },
        get document() {
            return globalThis.document;
        },
        get Event() {
            return globalThis.Event;
        },
    };

function getAbortControllerConstructor(
    scope: CreateMarkerCountSelectorRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(
    scope: CreateMarkerCountSelectorRuntimeScope
): Document {
    const runtimeDocument = scope.document;
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
    const EventConstructor = scope.Event ?? scope.document?.defaultView?.Event;
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
            return getDocument(scope).createElementNS(
                SVG_NAMESPACE,
                tagName
            );
        },
    };
}
