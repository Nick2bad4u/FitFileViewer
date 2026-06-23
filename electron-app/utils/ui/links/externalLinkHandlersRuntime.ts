type BrowserWindowOpen = (
    url?: string,
    target?: string,
    features?: string
) => WindowProxy | null;

export interface ExternalLinkHandlersRuntimeScope {
    readonly getElement?:
        | (() => typeof globalThis.Element | undefined)
        | undefined;
    readonly getHTMLAnchorElement?:
        | (() => typeof globalThis.HTMLAnchorElement | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
        | undefined;
    readonly getOpen?: (() => BrowserWindowOpen | undefined) | undefined;
}

export interface ExternalLinkHandlersRuntime {
    isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
    openBrowserWindow: (
        url: string,
        target: string,
        features: string
    ) => WindowProxy | null;
    resolveExternalLinkAnchor: (
        target: EventTarget | null
    ) => HTMLAnchorElement | null;
}

const defaultExternalLinkHandlersRuntimeScope: ExternalLinkHandlersRuntimeScope =
    {
        getElement: () => globalThis.Element,
        getHTMLAnchorElement: () => globalThis.HTMLAnchorElement,
        getKeyboardEvent: () => globalThis.KeyboardEvent,
        getOpen: () => globalThis.open,
    };

function getElementConstructor(
    scope: ExternalLinkHandlersRuntimeScope
): typeof globalThis.Element {
    const ElementConstructor = scope.getElement?.();
    if (typeof ElementConstructor !== "function") {
        throw new TypeError("externalLinkHandlers requires an Element runtime");
    }

    return ElementConstructor;
}

function getHTMLAnchorElementConstructor(
    scope: ExternalLinkHandlersRuntimeScope
): typeof globalThis.HTMLAnchorElement {
    const HTMLAnchorElementConstructor = scope.getHTMLAnchorElement?.();
    if (typeof HTMLAnchorElementConstructor !== "function") {
        throw new TypeError(
            "externalLinkHandlers requires an HTMLAnchorElement runtime"
        );
    }

    return HTMLAnchorElementConstructor;
}

function getKeyboardEventConstructor(
    scope: ExternalLinkHandlersRuntimeScope
): typeof globalThis.KeyboardEvent {
    const KeyboardEventConstructor = scope.getKeyboardEvent?.();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError(
            "externalLinkHandlers requires a KeyboardEvent runtime"
        );
    }

    return KeyboardEventConstructor;
}

function getBrowserWindowOpen(
    scope: ExternalLinkHandlersRuntimeScope
): BrowserWindowOpen | undefined {
    return scope.getOpen?.();
}

export function getExternalLinkHandlersRuntime(
    scope: ExternalLinkHandlersRuntimeScope = defaultExternalLinkHandlersRuntimeScope
): ExternalLinkHandlersRuntime {
    return {
        isKeyboardEvent(value: unknown): value is KeyboardEvent {
            return value instanceof getKeyboardEventConstructor(scope);
        },
        openBrowserWindow(url, target, features): WindowProxy | null {
            const open = getBrowserWindowOpen(scope);
            if (typeof open !== "function") {
                return null;
            }

            return open(url, target, features);
        },
        resolveExternalLinkAnchor(
            target: EventTarget | null
        ): HTMLAnchorElement | null {
            if (target === null) {
                return null;
            }

            if (!(target instanceof getElementConstructor(scope))) {
                return null;
            }

            const anchor = target.closest("a[data-external-link]");
            const HTMLAnchorElementConstructor =
                getHTMLAnchorElementConstructor(scope);

            return anchor instanceof HTMLAnchorElementConstructor
                ? anchor
                : null;
        },
    };
}
