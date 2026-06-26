import {
    type BrowserElementConstructor,
    type BrowserHTMLAnchorElementConstructor,
    type BrowserKeyboardEventConstructor,
    getBrowserElement,
    getBrowserHTMLAnchorElement,
    getBrowserKeyboardEvent,
    getBrowserOpen,
} from "../../runtime/browserRuntime.js";

type BrowserWindowOpen = (
    url?: string,
    target?: string,
    features?: string
) => WindowProxy | null;

export interface ExternalLinkHandlersRuntimeScope {
    readonly getElement?:
        | (() => BrowserElementConstructor | undefined)
        | undefined;
    readonly getHTMLAnchorElement?:
        | (() => BrowserHTMLAnchorElementConstructor | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => BrowserKeyboardEventConstructor | undefined)
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
        getElement: getBrowserElement,
        getHTMLAnchorElement: getBrowserHTMLAnchorElement,
        getKeyboardEvent: getBrowserKeyboardEvent,
        getOpen: getBrowserOpen,
    };

function getElementConstructor(
    scope: ExternalLinkHandlersRuntimeScope
): BrowserElementConstructor {
    const ElementConstructor = scope.getElement?.();
    if (typeof ElementConstructor !== "function") {
        throw new TypeError("externalLinkHandlers requires an Element runtime");
    }

    return ElementConstructor;
}

function getHTMLAnchorElementConstructor(
    scope: ExternalLinkHandlersRuntimeScope
): BrowserHTMLAnchorElementConstructor {
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
): BrowserKeyboardEventConstructor {
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
