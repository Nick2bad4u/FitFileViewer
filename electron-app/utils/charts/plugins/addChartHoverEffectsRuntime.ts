import {
    type BrowserAbortControllerConstructor,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type ChartHoverEffectsTimerHandle = BrowserTimerHandle | number;

type ChartHoverEffectsDocumentListener =
    | EventListener
    | Readonly<EventListenerObject>;
type ChartHoverEffectsKeydownListener = (
    event: Readonly<KeyboardEvent>
) => void;

interface ChartHoverEffectsFullscreenDocument extends Document {
    mozCancelFullScreen?: () => Promise<void> | void;
    mozFullScreenElement?: Element | null;
    msExitFullscreen?: () => Promise<void> | void;
    msFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
}

type ChartHoverEffectsRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface ChartHoverEffectsRuntimeScope {
    readonly getAbortController: ChartHoverEffectsRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: ChartHoverEffectsRuntimeProvider<Document>;
    readonly getDocumentEventTarget: ChartHoverEffectsRuntimeProvider<Document>;
    readonly getRequestAnimationFrame: ChartHoverEffectsRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getSetTimeout: ChartHoverEffectsRuntimeProvider<BrowserSetTimeout>;
}

export interface ChartHoverEffectsRuntime {
    readonly addDocumentEventListener: (
        eventName: string,
        listener: ChartHoverEffectsDocumentListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly addDocumentKeydownListener: (
        listener: ChartHoverEffectsKeydownListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly appendToHead: (element: Node) => void;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly appendToBody: (element: HTMLElement) => void;
    readonly exitFullscreen: () => Promise<void>;
    readonly getFullscreenElement: () => Element | null;
    readonly querySelector: (selector: string) => Element | null;
    readonly setBodyClass: (className: string, enabled: boolean) => void;
    readonly removeDocumentKeydownListener: (
        listener: ChartHoverEffectsKeydownListener
    ) => void;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        timeout: number
    ) => ChartHoverEffectsTimerHandle;
    readonly waitForAnimationFrame: () => Promise<void>;
}

export const CHART_HOVER_EFFECTS_SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const defaultChartHoverEffectsRuntimeScope: ChartHoverEffectsRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
    getDocumentEventTarget: getBrowserDocument,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredProvider<T>(
    provider: ChartHoverEffectsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUH]/u.test(providerName) ? "an" : "a";
        throw new TypeError(
            `chart hover effects require ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getRequiredSetTimeout(
    scope: ChartHoverEffectsRuntimeScope
): BrowserSetTimeout {
    const setTimeoutRef = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    )();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("chart hover effects require a setTimeout runtime");
    }

    return setTimeoutRef;
}

function getRequiredDocument(scope: ChartHoverEffectsRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError("chart hover effects require a document runtime");
    }

    return runtimeDocument;
}

function getFullscreenDocument(
    scope: ChartHoverEffectsRuntimeScope
): ChartHoverEffectsFullscreenDocument {
    return getRequiredDocument(scope);
}

function getDocumentEventTarget(
    scope: ChartHoverEffectsRuntimeScope
): Document | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "document event-target"
        )() ?? getRequiredProvider(scope.getDocument, "document")()
    );
}

function getRequiredDocumentEventTarget(
    scope: ChartHoverEffectsRuntimeScope
): Document {
    const documentEventTarget = getDocumentEventTarget(scope);
    if (!documentEventTarget) {
        throw new TypeError(
            "chart hover effects require a document event-target runtime"
        );
    }

    return documentEventTarget;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: ChartHoverEffectsRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getRequiredDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getChartHoverEffectsRuntime(
    scope: ChartHoverEffectsRuntimeScope = defaultChartHoverEffectsRuntimeScope
): ChartHoverEffectsRuntime {
    return {
        addDocumentEventListener(eventName, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            getRequiredDocumentEventTarget(scope).addEventListener(
                eventName,
                listener,
                options
            );
        },
        addDocumentKeydownListener(listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            getRequiredDocumentEventTarget(scope).addEventListener(
                "keydown",
                listener,
                options
            );
        },
        appendToHead(element): void {
            getRequiredDocument(scope).head.append(element);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getRequiredProvider(
                scope.getAbortController,
                "AbortController"
            )();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "chart hover effects require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getRequiredDocument(scope).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        appendToBody(element): void {
            getRequiredDocument(scope).body.append(element);
        },
        async exitFullscreen(): Promise<void> {
            const runtimeDocument = getFullscreenDocument(scope);
            const exit =
                runtimeDocument.exitFullscreen ||
                runtimeDocument.webkitExitFullscreen ||
                runtimeDocument.mozCancelFullScreen ||
                runtimeDocument.msExitFullscreen;
            if (!exit) {
                return;
            }

            await exit.call(runtimeDocument);
        },
        getFullscreenElement(): Element | null {
            const runtimeDocument = getFullscreenDocument(scope);
            return (
                runtimeDocument.fullscreenElement ||
                runtimeDocument.webkitFullscreenElement ||
                runtimeDocument.mozFullScreenElement ||
                runtimeDocument.msFullscreenElement ||
                null
            );
        },
        querySelector(selector): Element | null {
            return getRequiredDocument(scope).querySelector(selector);
        },
        setBodyClass(className, enabled): void {
            getRequiredDocument(scope).body.classList.toggle(
                className,
                enabled
            );
        },
        removeDocumentKeydownListener(listener): void {
            getRequiredDocumentEventTarget(scope).removeEventListener(
                "keydown",
                listener
            );
        },
        requestAnimationFrame(callback): null | number {
            const requestAnimationFrameRef = getRequiredProvider(
                scope.getRequestAnimationFrame,
                "requestAnimationFrame"
            )();
            if (typeof requestAnimationFrameRef !== "function") {
                const fallbackFrameTime = Number("0");
                callback(fallbackFrameTime);
                return null;
            }

            return requestAnimationFrameRef(callback);
        },
        setTimeout(callback, timeout): ChartHoverEffectsTimerHandle {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(callback, timeout);
        },
        async waitForAnimationFrame(): Promise<void> {
            await new Promise<void>((resolve) => {
                const requestAnimationFrameRef = getRequiredProvider(
                    scope.getRequestAnimationFrame,
                    "requestAnimationFrame"
                )();
                if (typeof requestAnimationFrameRef === "function") {
                    requestAnimationFrameRef(() => {
                        resolve();
                    });
                    return;
                }

                const setTimeoutRef = getRequiredSetTimeout(scope);
                const timeoutHandle = setTimeoutRef(resolve, 0);
                void timeoutHandle;
            });
        },
    };
}
