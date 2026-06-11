export interface CreateMarkerCountSelectorRuntimeScope {
    readonly document?: Document | undefined;
    readonly Event?: typeof Event | undefined;
}

export interface CreateMarkerCountSelectorRuntime {
    createChangeEvent: () => Event;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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
    const EventConstructor =
        scope.Event ?? scope.document?.defaultView?.Event ?? globalThis.Event;
    if (typeof EventConstructor !== "function") {
        throw new TypeError(
            "createMarkerCountSelector requires an Event runtime"
        );
    }

    return EventConstructor;
}

export function getCreateMarkerCountSelectorRuntime(
    scope: CreateMarkerCountSelectorRuntimeScope = globalThis
): CreateMarkerCountSelectorRuntime {
    return {
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
