import { getChartRenderContainer } from "../dom/chartDomUtils.js";
import {
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type ChartStateManagerTimeout = BrowserTimerHandle;

export interface ChartStateManagerRuntimeScope {
    readonly getClearTimeout: () => BrowserClearTimeout | undefined;
    readonly getDateNow: () => (() => number) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getSetTimeout: () => BrowserSetTimeout | undefined;
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
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getSetTimeout: getBrowserSetTimeout,
};

export function getChartStateManagerRuntime(
    scope: ChartStateManagerRuntimeScope = defaultChartStateManagerRuntimeScope
): ChartStateManagerRuntime {
    return {
        clearRenderTimeout(timeout): void {
            if (typeof scope.getClearTimeout !== "function") {
                throw new TypeError(
                    "ChartStateManager requires a clearTimeout provider"
                );
            }

            const clearTimeout = scope.getClearTimeout();
            if (typeof clearTimeout !== "function") {
                throw new TypeError("ChartStateManager requires clearTimeout");
            }

            clearTimeout(timeout);
        },
        dateNow(): number {
            if (typeof scope.getDateNow !== "function") {
                throw new TypeError(
                    "ChartStateManager requires a dateNow provider"
                );
            }

            const dateNow = scope.getDateNow();
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
            if (typeof scope.getSetTimeout !== "function") {
                throw new TypeError(
                    "ChartStateManager requires a setTimeout provider"
                );
            }

            const setTimeout = scope.getSetTimeout();
            if (typeof setTimeout !== "function") {
                throw new TypeError("ChartStateManager requires setTimeout");
            }

            return setTimeout(callback, delay);
        },
    };
}
