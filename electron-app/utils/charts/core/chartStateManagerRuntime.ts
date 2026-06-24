import { getChartRenderContainer } from "../dom/chartDomUtils.js";

export type ChartStateManagerTimeout = ReturnType<typeof globalThis.setTimeout>;

export interface ChartStateManagerRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface ChartStateManagerRuntime {
    readonly clearRenderTimeout: (timeout: ChartStateManagerTimeout) => void;
    readonly dateNow: () => number;
    readonly getChartRenderContainer: () => HTMLElement | null;
    readonly getControlsPanel: () => HTMLElement | null;
    readonly setRenderTimeout: (
        callback: () => void,
        delay: number
    ) => ChartStateManagerTimeout;
}

const defaultChartStateManagerRuntimeScope: ChartStateManagerRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getDateNow: () => Date.now,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getChartStateManagerRuntime(
    scope: ChartStateManagerRuntimeScope = defaultChartStateManagerRuntimeScope
): ChartStateManagerRuntime {
    return {
        clearRenderTimeout(timeout): void {
            const clearTimeout = scope.getClearTimeout?.();
            if (typeof clearTimeout !== "function") {
                throw new TypeError("ChartStateManager requires clearTimeout");
            }

            clearTimeout(timeout);
        },
        dateNow(): number {
            const dateNow = scope.getDateNow?.();
            if (typeof dateNow !== "function") {
                throw new TypeError("ChartStateManager requires dateNow");
            }

            return dateNow();
        },
        getChartRenderContainer(): HTMLElement | null {
            const document = scope.getDocument?.();
            return document ? getChartRenderContainer(document) : null;
        },
        getControlsPanel(): HTMLElement | null {
            const controlsPanel =
                scope.getDocument?.()?.querySelector(".chart-controls") ?? null;
            const HTMLElementConstructor = scope.getHTMLElement?.();

            return typeof HTMLElementConstructor === "function" &&
                controlsPanel instanceof HTMLElementConstructor
                ? controlsPanel
                : null;
        },
        setRenderTimeout(callback, delay): ChartStateManagerTimeout {
            const setTimeout = scope.getSetTimeout?.();
            if (typeof setTimeout !== "function") {
                throw new TypeError("ChartStateManager requires setTimeout");
            }

            return setTimeout(callback, delay);
        },
    };
}
