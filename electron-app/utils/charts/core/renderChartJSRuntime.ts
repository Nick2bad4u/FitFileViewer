import {
    type BrowserCustomEventConstructor,
    getBrowserCustomEvent,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserPerformance,
} from "../../runtime/browserRuntime.js";

export interface RenderChartJSRuntimeScope {
    readonly getCustomEventConstructor: () =>
        | BrowserCustomEventConstructor
        | undefined;
    readonly getDateNow: () => (() => number) | undefined;
    readonly getDocument: () => Document | undefined;
    readonly getIsRendererScope: () => boolean | undefined;
    readonly getPerformance: () => Pick<Performance, "now"> | undefined;
}

export interface RenderChartJSRuntime {
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    getCustomEventConstructor: () => BrowserCustomEventConstructor | undefined;
    isWindowAvailable: () => boolean;
    now: () => number;
    nowPerformance: () => number;
}

const defaultRenderChartJSRuntimeScope: RenderChartJSRuntimeScope = {
    getCustomEventConstructor: getBrowserCustomEvent,
    getDateNow: getBrowserDateNow,
    getDocument: getBrowserDocument,
    getIsRendererScope: () => getBrowserDocument() !== undefined,
    getPerformance: getBrowserPerformance,
};

function getRequiredDateNow(scope: RenderChartJSRuntimeScope): () => number {
    if (typeof scope.getDateNow !== "function") {
        throw new TypeError("renderChartJSRuntime requires a dateNow provider");
    }

    const dateNow = scope.getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError("renderChartJSRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: RenderChartJSRuntimeScope
): () => number {
    const performance = getScopePerformance(scope);
    const performanceNow = performance?.now;
    if (typeof performanceNow !== "function") {
        return getRequiredDateNow(scope);
    }

    return performanceNow.bind(performance);
}

function getScopeCustomEventConstructor(
    scope: RenderChartJSRuntimeScope
): BrowserCustomEventConstructor | undefined {
    if (typeof scope.getCustomEventConstructor !== "function") {
        throw new TypeError(
            "renderChartJSRuntime requires a CustomEvent provider"
        );
    }

    return scope.getCustomEventConstructor();
}

function getRequiredDocument(scope: RenderChartJSRuntimeScope): Document {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "renderChartJSRuntime requires a document provider"
        );
    }

    const documentRef = scope.getDocument();
    if (!documentRef) {
        throw new TypeError("renderChartJSRuntime requires document");
    }

    return documentRef;
}

function getScopePerformance(
    scope: RenderChartJSRuntimeScope
): Pick<Performance, "now"> | undefined {
    if (typeof scope.getPerformance !== "function") {
        throw new TypeError(
            "renderChartJSRuntime requires a performance provider"
        );
    }

    return scope.getPerformance();
}

function getIsRendererScope(scope: RenderChartJSRuntimeScope): boolean {
    if (typeof scope.getIsRendererScope !== "function") {
        throw new TypeError(
            "renderChartJSRuntime requires a renderer-scope provider"
        );
    }

    return scope.getIsRendererScope() ?? false;
}

export function getRenderChartJSRuntime(
    scope: RenderChartJSRuntimeScope = defaultRenderChartJSRuntimeScope
): RenderChartJSRuntime {
    return {
        createElement(tagName) {
            return getRequiredDocument(scope).createElement(tagName);
        },

        getCustomEventConstructor(): BrowserCustomEventConstructor | undefined {
            return getScopeCustomEventConstructor(scope);
        },

        isWindowAvailable(): boolean {
            return getIsRendererScope(scope);
        },

        now(): number {
            return getRequiredDateNow(scope)();
        },

        nowPerformance(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}
