import {
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type ChartHoverEffectsTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type ChartHoverEffectsSetTimeout = (
    callback: () => void,
    timeout: number
) => ChartHoverEffectsTimerHandle;
type ChartHoverEffectsDocumentListener =
    | EventListener
    | Readonly<EventListenerObject>;
type ChartHoverEffectsKeydownListener = (
    event: Readonly<KeyboardEvent>
) => void;

export interface ChartHoverEffectsRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => ChartHoverEffectsSetTimeout | undefined)
        | undefined;
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
    readonly createAbortController: () => AbortController;
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly appendToBody: (element: HTMLElement) => void;
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
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredSetTimeout(
    scope: ChartHoverEffectsRuntimeScope
): ChartHoverEffectsSetTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("chart hover effects require a setTimeout runtime");
    }

    return setTimeoutRef;
}

function getRequiredDocument(scope: ChartHoverEffectsRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("chart hover effects require a document runtime");
    }

    return runtimeDocument;
}

function getDocumentEventTarget(
    scope: ChartHoverEffectsRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.() ?? scope.getDocument?.();
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
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "chart hover effects require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        appendToBody(element): void {
            getRequiredDocument(scope).body.append(element);
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
            const requestAnimationFrameRef = scope.getRequestAnimationFrame?.();
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
                const requestAnimationFrameRef =
                    scope.getRequestAnimationFrame?.();
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
