export interface RenderChartDirectRerenderRuntimeScope {
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
}

export interface RenderChartDirectRerenderRuntime {
    queryChartContainer: () => HTMLElement | null;
    querySelector: (selector: string) => HTMLElement | null;
}

const chartContainerSelectors = [
    "#chartjs_chart_container",
    "#content_chartjs",
    "#content_chart",
] as const;

const defaultRenderChartDirectRerenderRuntimeScope: RenderChartDirectRerenderRuntimeScope =
    globalThis;

function getHTMLElementConstructor(
    scope: RenderChartDirectRerenderRuntimeScope
): typeof HTMLElement | undefined {
    return scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
}

function isHTMLElement(
    scope: RenderChartDirectRerenderRuntimeScope,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = getHTMLElementConstructor(scope);
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

function queryHTMLElement(
    scope: RenderChartDirectRerenderRuntimeScope,
    selector: string
): HTMLElement | null {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        return null;
    }

    const element = runtimeDocument.querySelector(selector);
    return isHTMLElement(scope, element) ? element : null;
}

export function getRenderChartDirectRerenderRuntime(
    scope: RenderChartDirectRerenderRuntimeScope = defaultRenderChartDirectRerenderRuntimeScope
): RenderChartDirectRerenderRuntime {
    return {
        queryChartContainer(): HTMLElement | null {
            for (const selector of chartContainerSelectors) {
                const element = queryHTMLElement(scope, selector);
                if (element) {
                    return element;
                }
            }

            return null;
        },
        querySelector(selector: string): HTMLElement | null {
            return queryHTMLElement(scope, selector);
        },
    };
}
