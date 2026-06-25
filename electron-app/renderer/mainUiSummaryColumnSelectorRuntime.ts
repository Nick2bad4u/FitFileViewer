import { getElementByIdFlexible } from "../utils/ui/dom/elementIdUtils.js";
import {
    getBrowserRendererDocument,
    getBrowserRendererHTMLElement,
    getBrowserRendererSetTimeout,
} from "./rendererBrowserRuntime.js";

export type MainUiSummaryColumnSelectorTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface MainUiSummaryColumnSelectorRuntimeScope {
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface MainUiSummaryColumnSelectorRuntime {
    getSummaryGearButton: (selector: string) => HTMLElement | null;
    getSummaryTab: (id: string) => HTMLElement | null;
    setTimeout: (
        callback: () => void,
        delay: number
    ) => MainUiSummaryColumnSelectorTimer;
}

const defaultMainUiSummaryColumnSelectorRuntimeScope: MainUiSummaryColumnSelectorRuntimeScope =
    {
        getDocument: getBrowserRendererDocument,
        getHTMLElement: getBrowserRendererHTMLElement,
        getSetTimeout: getBrowserRendererSetTimeout,
    };

function isHTMLElement(
    scope: MainUiSummaryColumnSelectorRuntimeScope,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

export function getMainUiSummaryColumnSelectorRuntime(
    scope: MainUiSummaryColumnSelectorRuntimeScope = defaultMainUiSummaryColumnSelectorRuntimeScope
): MainUiSummaryColumnSelectorRuntime {
    return {
        getSummaryGearButton(selector): HTMLElement | null {
            const element =
                scope.getDocument?.()?.querySelector(selector) ?? null;
            return isHTMLElement(scope, element) ? element : null;
        },
        getSummaryTab(id): HTMLElement | null {
            const documentTarget = scope.getDocument?.();
            if (!documentTarget) {
                return null;
            }

            const element = getElementByIdFlexible(documentTarget, id);
            return isHTMLElement(scope, element) ? element : null;
        },
        setTimeout(callback, delay): MainUiSummaryColumnSelectorTimer {
            const setTimeout = scope.getSetTimeout?.();
            if (typeof setTimeout !== "function") {
                throw new TypeError(
                    "main UI summary selector requires setTimeout"
                );
            }

            return setTimeout(callback, delay);
        },
    };
}
