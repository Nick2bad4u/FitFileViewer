import { getChartRenderContainer } from "../dom/chartDomUtils.js";

export type ChartStateManagerTimeout = ReturnType<typeof globalThis.setTimeout>;

export interface ChartStateManagerRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout;
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout;
}

export interface ChartStateManagerRuntime {
    clearRenderTimeout: (timeout: ChartStateManagerTimeout) => void;
    getChartRenderContainer: () => HTMLElement | null;
    getControlsPanel: () => HTMLElement | null;
    setRenderTimeout: (
        callback: () => void,
        delay: number
    ) => ChartStateManagerTimeout;
}

const defaultChartStateManagerRuntimeScope: ChartStateManagerRuntimeScope =
    globalThis;

export function getChartStateManagerRuntime(
    scope: ChartStateManagerRuntimeScope = defaultChartStateManagerRuntimeScope
): ChartStateManagerRuntime {
    return {
        clearRenderTimeout(timeout): void {
            const clearTimeout = scope.clearTimeout;
            if (typeof clearTimeout !== "function") {
                throw new TypeError(
                    "ChartStateManager requires clearTimeout"
                );
            }

            clearTimeout(timeout);
        },
        getChartRenderContainer(): HTMLElement | null {
            const document = scope.document;
            return document ? getChartRenderContainer(document) : null;
        },
        getControlsPanel(): HTMLElement | null {
            const controlsPanel =
                scope.document?.querySelector(".chart-controls") ?? null;
            const HTMLElementConstructor = scope.HTMLElement;

            return typeof HTMLElementConstructor === "function" &&
                controlsPanel instanceof HTMLElementConstructor
                ? controlsPanel
                : null;
        },
        setRenderTimeout(callback, delay): ChartStateManagerTimeout {
            const setTimeout = scope.setTimeout;
            if (typeof setTimeout !== "function") {
                throw new TypeError("ChartStateManager requires setTimeout");
            }

            return setTimeout(callback, delay);
        },
    };
}
