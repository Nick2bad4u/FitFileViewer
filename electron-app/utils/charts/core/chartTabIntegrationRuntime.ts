export interface ChartTabIntegrationRuntimeScope {
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
}

export interface ChartTabIntegrationRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
    queryChartTabButton: () => HTMLElement | null;
    querySelector: (selector: string) => HTMLElement | null;
}

const chartTabButtonSelectors = [
    "#tab_chartjs",
    "#tab_chart",
    '[data-tab="chart"]',
] as const;

const defaultChartTabIntegrationRuntimeScope: ChartTabIntegrationRuntimeScope =
    globalThis;

function getHTMLElementConstructor(
    scope: ChartTabIntegrationRuntimeScope
): typeof HTMLElement | undefined {
    return scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
}

function isHTMLElement(
    scope: ChartTabIntegrationRuntimeScope,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = getHTMLElementConstructor(scope);
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

function queryHTMLElement(
    scope: ChartTabIntegrationRuntimeScope,
    selector: string
): HTMLElement | null {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        return null;
    }

    const element = runtimeDocument.querySelector(selector);
    return isHTMLElement(scope, element) ? element : null;
}

export function getChartTabIntegrationRuntime(
    scope: ChartTabIntegrationRuntimeScope = defaultChartTabIntegrationRuntimeScope
): ChartTabIntegrationRuntime {
    return {
        isHTMLElement(value: unknown): value is HTMLElement {
            return isHTMLElement(scope, value);
        },
        queryChartTabButton(): HTMLElement | null {
            for (const selector of chartTabButtonSelectors) {
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
