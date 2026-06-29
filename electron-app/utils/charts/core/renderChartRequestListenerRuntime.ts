import {
    type BrowserCustomEventConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAddEventListener,
    getBrowserCustomEvent,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

type RenderChartRequestEventListener =
    | EventListener
    | Readonly<EventListenerObject>;

type RenderChartRequestListenerAddEventListener = (
    type: string,
    listener: RenderChartRequestEventListener,
    options?: Readonly<AddEventListenerOptions> | boolean
) => void;

type RenderChartRequestListenerDocument = Pick<
    Document,
    "body" | "querySelector"
>;

export interface RenderChartRequestListenerRuntimeScope {
    readonly getAddEventListener: () =>
        | RenderChartRequestListenerAddEventListener
        | undefined;
    readonly getCustomEvent: () => BrowserCustomEventConstructor | undefined;
    readonly getDocument: () => RenderChartRequestListenerDocument | undefined;
    readonly getHTMLElement: () => BrowserHTMLElementConstructor | undefined;
}

export interface RenderChartRequestListenerRuntime {
    addChartRequestListener: (
        listener: RenderChartRequestEventListener,
        options: Readonly<AddEventListenerOptions> & {
            readonly signal: AbortSignal;
        }
    ) => void;
    getFallbackChartContainer: () => HTMLElement;
    isCustomEvent: (event: Readonly<Event>) => event is CustomEvent<unknown>;
    querySelector: (selector: string) => HTMLElement | null;
}

/* eslint-disable perfectionist/sort-arrays -- Prefer chartjs containers before legacy chart containers. */
const fallbackContainerSelectors = [
    "#chartjs_chart_container",
    "#content_chartjs",
    "#content_chart",
] as const;
/* eslint-enable perfectionist/sort-arrays -- Re-enable array sorting after the prioritized container list. */

const defaultRenderChartRequestListenerRuntimeScope: RenderChartRequestListenerRuntimeScope =
    {
        getAddEventListener: getBrowserAddEventListener,
        getCustomEvent: getBrowserCustomEvent,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
    };

function getCustomEventConstructor(
    scope: RenderChartRequestListenerRuntimeScope
): BrowserCustomEventConstructor | undefined {
    if (typeof scope.getCustomEvent !== "function") {
        throw new TypeError(
            "renderChartRequestListener requires a CustomEvent provider"
        );
    }

    return scope.getCustomEvent();
}

function getDocument(
    scope: RenderChartRequestListenerRuntimeScope
): RenderChartRequestListenerDocument {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "renderChartRequestListener requires a document provider"
        );
    }

    const runtimeDocument = scope.getDocument();
    if (!runtimeDocument) {
        throw new TypeError("renderChartRequestListener requires a document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: RenderChartRequestListenerRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    if (typeof scope.getHTMLElement !== "function") {
        throw new TypeError(
            "renderChartRequestListener requires an HTMLElement provider"
        );
    }

    return scope.getHTMLElement();
}

function isHTMLElement(
    scope: RenderChartRequestListenerRuntimeScope,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = getHTMLElementConstructor(scope);
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

function queryHTMLElement(
    scope: RenderChartRequestListenerRuntimeScope,
    selector: string
): HTMLElement | null {
    const element = getDocument(scope).querySelector(selector);
    return isHTMLElement(scope, element) ? element : null;
}

export function getRenderChartRequestListenerRuntime(
    scope: RenderChartRequestListenerRuntimeScope = defaultRenderChartRequestListenerRuntimeScope
): RenderChartRequestListenerRuntime {
    return {
        addChartRequestListener(
            listener: RenderChartRequestEventListener,
            options: Readonly<AddEventListenerOptions> & {
                readonly signal: AbortSignal;
            }
        ): void {
            if (typeof scope.getAddEventListener !== "function") {
                throw new TypeError(
                    "renderChartRequestListener requires an addEventListener provider"
                );
            }

            const addEventListener = scope.getAddEventListener();
            if (typeof addEventListener !== "function") {
                throw new TypeError(
                    "renderChartRequestListener requires addEventListener"
                );
            }

            addEventListener("ffv:request-render-charts", listener, {
                ...options,
                signal: options.signal,
            });
        },
        getFallbackChartContainer(): HTMLElement {
            for (const selector of fallbackContainerSelectors) {
                const element = queryHTMLElement(scope, selector);
                if (element) {
                    return element;
                }
            }

            return getDocument(scope).body;
        },
        isCustomEvent(event: Readonly<Event>): event is CustomEvent<unknown> {
            const CustomEventConstructor = getCustomEventConstructor(scope);
            return (
                typeof CustomEventConstructor === "function" &&
                event instanceof CustomEventConstructor
            );
        },
        querySelector(selector: string): HTMLElement | null {
            return queryHTMLElement(scope, selector);
        },
    };
}
