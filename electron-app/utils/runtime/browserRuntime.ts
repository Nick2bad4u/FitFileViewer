export function getBrowserAbortController():
    | typeof globalThis.AbortController
    | undefined {
    return globalThis.AbortController;
}

export function getBrowserAddEventListener():
    | typeof globalThis.addEventListener
    | undefined {
    return typeof globalThis.addEventListener === "function"
        ? globalThis.addEventListener.bind(globalThis)
        : undefined;
}

export function getBrowserRemoveEventListener():
    | typeof globalThis.removeEventListener
    | undefined {
    return typeof globalThis.removeEventListener === "function"
        ? globalThis.removeEventListener.bind(globalThis)
        : undefined;
}

export function getBrowserCancelIdleCallback():
    | typeof globalThis.cancelIdleCallback
    | undefined {
    return typeof globalThis.cancelIdleCallback === "function"
        ? globalThis.cancelIdleCallback.bind(globalThis)
        : undefined;
}

export function getBrowserCancelAnimationFrame():
    | typeof globalThis.cancelAnimationFrame
    | undefined {
    return typeof globalThis.cancelAnimationFrame === "function"
        ? globalThis.cancelAnimationFrame.bind(globalThis)
        : undefined;
}

export function getBrowserClearInterval():
    | typeof globalThis.clearInterval
    | undefined {
    return globalThis.clearInterval;
}

export function getBrowserBoundClearInterval():
    | typeof globalThis.clearInterval
    | undefined {
    return typeof globalThis.clearInterval === "function"
        ? globalThis.clearInterval.bind(globalThis)
        : undefined;
}

export function getBrowserClearTimeout():
    | typeof globalThis.clearTimeout
    | undefined {
    return globalThis.clearTimeout;
}

export function getBrowserBoundClearTimeout():
    | typeof globalThis.clearTimeout
    | undefined {
    return typeof globalThis.clearTimeout === "function"
        ? globalThis.clearTimeout.bind(globalThis)
        : undefined;
}

export function getBrowserConsole(): Console | undefined {
    return globalThis.console;
}

export function getBrowserClipboard(): Clipboard | undefined {
    return globalThis.navigator?.clipboard;
}

export function getBrowserComputedStyle():
    | typeof globalThis.getComputedStyle
    | undefined {
    return typeof globalThis.getComputedStyle === "function"
        ? globalThis.getComputedStyle.bind(globalThis)
        : undefined;
}

export function getBrowserCustomEvent():
    | typeof globalThis.CustomEvent
    | undefined {
    return globalThis.CustomEvent;
}

export function getBrowserCrypto(): Crypto | undefined {
    return globalThis.crypto;
}

export function getBrowserDateNow(): (() => number) | undefined {
    return Date.now;
}

export function getBrowserDispatchEvent():
    | typeof globalThis.dispatchEvent
    | undefined {
    return typeof globalThis.dispatchEvent === "function"
        ? globalThis.dispatchEvent.bind(globalThis)
        : undefined;
}

export function getBrowserDocument(): Document | undefined {
    return globalThis.document;
}

export function getBrowserDOMParser():
    | typeof globalThis.DOMParser
    | undefined {
    return globalThis.DOMParser;
}

export function getBrowserElement(): typeof globalThis.Element | undefined {
    return globalThis.Element;
}

export function getBrowserEventTarget(): EventTarget | undefined {
    return globalThis;
}

export function getBrowserEvent(): typeof globalThis.Event | undefined {
    return globalThis.Event;
}

export function getBrowserFetch(): typeof globalThis.fetch | undefined {
    return globalThis.fetch;
}

export function getBrowserFileReader():
    | typeof globalThis.FileReader
    | undefined {
    return globalThis.FileReader;
}

export function getBrowserHTMLElement():
    | typeof globalThis.HTMLElement
    | undefined {
    return globalThis.HTMLElement;
}

export function getBrowserIntersectionObserver():
    | typeof globalThis.IntersectionObserver
    | undefined {
    return globalThis.IntersectionObserver;
}

export function getBrowserSVGElement():
    | typeof globalThis.SVGElement
    | undefined {
    return globalThis.SVGElement;
}

export function getBrowserHTMLAnchorElement():
    | typeof globalThis.HTMLAnchorElement
    | undefined {
    return globalThis.HTMLAnchorElement;
}

export function getBrowserHTMLButtonElement():
    | typeof globalThis.HTMLButtonElement
    | undefined {
    return globalThis.HTMLButtonElement;
}

export function getBrowserHTMLCanvasElement():
    | typeof globalThis.HTMLCanvasElement
    | undefined {
    return globalThis.HTMLCanvasElement;
}

export function getBrowserHTMLInputElement():
    | typeof globalThis.HTMLInputElement
    | undefined {
    return globalThis.HTMLInputElement;
}

export function getBrowserHTMLSelectElement():
    | typeof globalThis.HTMLSelectElement
    | undefined {
    return globalThis.HTMLSelectElement;
}

export function getBrowserHTMLScriptElement():
    | typeof globalThis.HTMLScriptElement
    | undefined {
    return globalThis.HTMLScriptElement;
}

export function getBrowserHTMLTableCellElement():
    | typeof globalThis.HTMLTableCellElement
    | undefined {
    return globalThis.HTMLTableCellElement;
}

export function getBrowserHTMLTextAreaElement():
    | typeof globalThis.HTMLTextAreaElement
    | undefined {
    return globalThis.HTMLTextAreaElement;
}

export function getBrowserKeyboardEvent():
    | typeof globalThis.KeyboardEvent
    | undefined {
    return globalThis.KeyboardEvent;
}

export function getBrowserMouseEvent():
    | typeof globalThis.MouseEvent
    | undefined {
    return globalThis.MouseEvent;
}

export function getBrowserLocalStorage(): Storage | undefined {
    return globalThis.localStorage;
}

export function getBrowserLocation(): Location | undefined {
    return globalThis.location;
}

export function getBrowserMatchMedia():
    | typeof globalThis.matchMedia
    | undefined {
    return globalThis.matchMedia;
}

export function getBrowserPerformance(): Performance | undefined {
    return globalThis.performance;
}

export function getBrowserPrint(): typeof globalThis.print | undefined {
    return typeof globalThis.print === "function"
        ? globalThis.print.bind(globalThis)
        : undefined;
}

export function getBrowserQueueMicrotask():
    | typeof globalThis.queueMicrotask
    | undefined {
    return typeof globalThis.queueMicrotask === "function"
        ? globalThis.queueMicrotask.bind(globalThis)
        : undefined;
}

export function getBrowserRequestIdleCallback():
    | typeof globalThis.requestIdleCallback
    | undefined {
    return typeof globalThis.requestIdleCallback === "function"
        ? globalThis.requestIdleCallback.bind(globalThis)
        : undefined;
}

export function getBrowserRequestAnimationFrame():
    | typeof globalThis.requestAnimationFrame
    | undefined {
    return typeof globalThis.requestAnimationFrame === "function"
        ? globalThis.requestAnimationFrame.bind(globalThis)
        : undefined;
}

export function getBrowserResponse(): typeof globalThis.Response | undefined {
    return globalThis.Response;
}

export function getBrowserResizeObserver():
    | typeof globalThis.ResizeObserver
    | undefined {
    return globalThis.ResizeObserver;
}

export function getBrowserMutationObserver():
    | typeof globalThis.MutationObserver
    | undefined {
    return globalThis.MutationObserver;
}

export function getBrowserNavigator(): Navigator | undefined {
    return globalThis.navigator;
}

export function getBrowserNode(): typeof globalThis.Node | undefined {
    return globalThis.Node;
}

export function getBrowserOpen(): typeof globalThis.open | undefined {
    return typeof globalThis.open === "function"
        ? globalThis.open.bind(globalThis)
        : undefined;
}

export function getBrowserNodeFilter():
    | typeof globalThis.NodeFilter
    | undefined {
    return globalThis.NodeFilter;
}

export function getBrowserSetInterval():
    | typeof globalThis.setInterval
    | undefined {
    return globalThis.setInterval;
}

export function getBrowserBoundSetInterval():
    | typeof globalThis.setInterval
    | undefined {
    return typeof globalThis.setInterval === "function"
        ? globalThis.setInterval.bind(globalThis)
        : undefined;
}

export function getBrowserSetTimeout():
    | typeof globalThis.setTimeout
    | undefined {
    return globalThis.setTimeout;
}

export function getBrowserBoundSetTimeout():
    | typeof globalThis.setTimeout
    | undefined {
    return typeof globalThis.setTimeout === "function"
        ? globalThis.setTimeout.bind(globalThis)
        : undefined;
}

export function getBrowserURL(): typeof globalThis.URL | undefined {
    return globalThis.URL;
}

export function getBrowserScrollTo():
    | ((options: Readonly<ScrollToOptions>) => void)
    | undefined {
    return typeof globalThis.scrollTo === "function"
        ? globalThis.scrollTo.bind(globalThis)
        : undefined;
}

export function getBrowserViewport():
    | Readonly<{ height: number; width: number }>
    | undefined {
    return {
        height: globalThis.innerHeight,
        width: globalThis.innerWidth,
    };
}
