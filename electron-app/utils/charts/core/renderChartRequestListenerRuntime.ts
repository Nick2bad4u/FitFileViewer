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
    "body" | "defaultView" | "querySelector"
>;

export interface RenderChartRequestListenerRuntimeScope {
    readonly getAddEventListener?:
        | (() => RenderChartRequestListenerAddEventListener | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => typeof CustomEvent | undefined)
        | undefined;
    readonly getDocument?:
        | (() => RenderChartRequestListenerDocument | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
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
        getAddEventListener: () => globalThis.addEventListener,
        getCustomEvent: () => globalThis.CustomEvent,
        getDocument: () => globalThis.document,
        getHTMLElement: () => globalThis.HTMLElement,
    };

function getCustomEventConstructor(
    scope: RenderChartRequestListenerRuntimeScope
): typeof CustomEvent | undefined {
    return (
        scope.getCustomEvent?.() ??
        scope.getDocument?.()?.defaultView?.CustomEvent
    );
}

function getDocument(
    scope: RenderChartRequestListenerRuntimeScope
): RenderChartRequestListenerDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("renderChartRequestListener requires a document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: RenderChartRequestListenerRuntimeScope
): typeof HTMLElement | undefined {
    return (
        scope.getHTMLElement?.() ??
        scope.getDocument?.()?.defaultView?.HTMLElement
    );
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
            const addEventListener = scope.getAddEventListener?.();
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
