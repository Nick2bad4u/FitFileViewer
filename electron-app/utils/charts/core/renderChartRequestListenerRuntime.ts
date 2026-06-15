export interface RenderChartRequestListenerRuntimeScope {
    readonly addEventListener?:
        | ((
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: AddEventListenerOptions | boolean
          ) => void)
        | undefined;
    readonly CustomEvent?: typeof CustomEvent | undefined;
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
}

export interface RenderChartRequestListenerRuntime {
    addChartRequestListener: (
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ) => void;
    getFallbackChartContainer: () => HTMLElement;
    isCustomEvent: (event: Event) => event is CustomEvent<unknown>;
    querySelector: (selector: string) => HTMLElement | null;
}

const fallbackContainerSelectors = [
    "#chartjs_chart_container",
    "#content_chartjs",
    "#content_chart",
] as const;

const defaultRenderChartRequestListenerRuntimeScope: RenderChartRequestListenerRuntimeScope =
    globalThis;

function getCustomEventConstructor(
    scope: RenderChartRequestListenerRuntimeScope
): typeof CustomEvent | undefined {
    return scope.CustomEvent ?? scope.document?.defaultView?.CustomEvent;
}

function getDocument(scope: RenderChartRequestListenerRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("renderChartRequestListener requires a document");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: RenderChartRequestListenerRuntimeScope
): typeof HTMLElement | undefined {
    return scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
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
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            if (typeof scope.addEventListener !== "function") {
                throw new TypeError(
                    "renderChartRequestListener requires addEventListener"
                );
            }

            scope.addEventListener("ffv:request-render-charts", listener, {
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
        isCustomEvent(event: Event): event is CustomEvent<unknown> {
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
