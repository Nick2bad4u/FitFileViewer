import {
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

type RenderChartDirectRerenderDocument = Pick<Document, "querySelector">;

type RenderChartDirectRerenderRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface RenderChartDirectRerenderRuntimeScope {
    readonly getDocument: RenderChartDirectRerenderRuntimeProvider<RenderChartDirectRerenderDocument>;
    readonly getHTMLElement: RenderChartDirectRerenderRuntimeProvider<BrowserHTMLElementConstructor>;
}

export interface RenderChartDirectRerenderRuntime {
    queryChartContainer: () => HTMLElement | null;
    querySelector: (selector: string) => HTMLElement | null;
}

/* eslint-disable perfectionist/sort-arrays -- Prefer chartjs containers before legacy chart containers. */
const chartContainerSelectors = [
    "#chartjs_chart_container",
    "#content_chartjs",
    "#content_chart",
] as const;
/* eslint-enable perfectionist/sort-arrays -- Re-enable array sorting after the prioritized container list. */

const defaultRenderChartDirectRerenderRuntimeScope: RenderChartDirectRerenderRuntimeScope =
    {
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
    };

function getRequiredProvider<T>(
    provider: RenderChartDirectRerenderRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUH]/u.test(providerName) ? "an" : "a";
        throw new TypeError(
            `renderChartDirectRerender requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getHTMLElementConstructor(
    scope: RenderChartDirectRerenderRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return getRequiredProvider(scope.getHTMLElement, "HTMLElement")();
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
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
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
