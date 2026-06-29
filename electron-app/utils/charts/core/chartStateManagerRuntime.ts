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

type ChartStateManagerRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface ChartStateManagerRuntimeScope {
    readonly getClearTimeout: ChartStateManagerRuntimeProvider<BrowserClearTimeout>;
    readonly getDateNow: ChartStateManagerRuntimeProvider<() => number>;
    readonly getDocument: ChartStateManagerRuntimeProvider<Document>;
    readonly getHTMLElement: ChartStateManagerRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getSetTimeout: ChartStateManagerRuntimeProvider<BrowserSetTimeout>;
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

function getRequiredProvider<T>(
    provider: ChartStateManagerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUH]/u.test(providerName) ? "an" : "a";
        throw new TypeError(
            `ChartStateManager requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

export function getChartStateManagerRuntime(
    scope: ChartStateManagerRuntimeScope = defaultChartStateManagerRuntimeScope
): ChartStateManagerRuntime {
    return {
        clearRenderTimeout(timeout): void {
            const clearTimeout = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
            if (typeof clearTimeout !== "function") {
                throw new TypeError("ChartStateManager requires clearTimeout");
            }

            clearTimeout(timeout);
        },
        dateNow(): number {
            const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
            if (typeof dateNow !== "function") {
                throw new TypeError("ChartStateManager requires dateNow");
            }

            return dateNow();
        },
        getChartRenderContainer(): HTMLElement | null {
            const document = getRequiredProvider(
                scope.getDocument,
                "document"
            )();
            return document ? getChartRenderContainer(document) : null;
        },
        getControlsPanel(): HTMLElement | null {
            const controlsPanel =
                getRequiredProvider(
                    scope.getDocument,
                    "document"
                )()?.querySelector(".chart-controls") ?? null;
            const HTMLElementConstructor = getRequiredProvider(
                scope.getHTMLElement,
                "HTMLElement"
            )();

            return typeof HTMLElementConstructor === "function" &&
                controlsPanel instanceof HTMLElementConstructor
                ? controlsPanel
                : null;
        },
        setRenderTimeout(callback, delay): ChartStateManagerTimeout {
            const setTimeout = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof setTimeout !== "function") {
                throw new TypeError("ChartStateManager requires setTimeout");
            }

            return setTimeout(callback, delay);
        },
    };
}
