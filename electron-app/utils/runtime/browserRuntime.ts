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

export function getBrowserClearTimeout():
    | typeof globalThis.clearTimeout
    | undefined {
    return globalThis.clearTimeout;
}

export function getBrowserComputedStyle():
    | typeof globalThis.getComputedStyle
    | undefined {
    return typeof globalThis.getComputedStyle === "function"
        ? globalThis.getComputedStyle.bind(globalThis)
        : undefined;
}

export function getBrowserDateNow(): (() => number) | undefined {
    return Date.now;
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

export function getBrowserSetTimeout():
    | typeof globalThis.setTimeout
    | undefined {
    return globalThis.setTimeout;
}

export function getBrowserViewport():
    | Readonly<{ height: number; width: number }>
    | undefined {
    return {
        height: globalThis.innerHeight,
        width: globalThis.innerWidth,
    };
}
