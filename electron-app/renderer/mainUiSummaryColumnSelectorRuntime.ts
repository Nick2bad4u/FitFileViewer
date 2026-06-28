import { getElementByIdFlexible } from "../utils/ui/dom/elementIdUtils.js";
import {
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
} from "../utils/runtime/browserRuntime.js";

export type MainUiSummaryColumnSelectorTimer = BrowserTimerHandle;

export interface MainUiSummaryColumnSelectorRuntimeScope {
    readonly getDocument: () => Document | undefined;
    readonly getHTMLElement: () => BrowserHTMLElementConstructor | undefined;
    readonly getSetTimeout: () => BrowserSetTimeout | undefined;
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
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        getSetTimeout: getBrowserSetTimeout,
    };

function isHTMLElement(
    scope: MainUiSummaryColumnSelectorRuntimeScope,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement();
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

export function getMainUiSummaryColumnSelectorRuntime(
    scope: MainUiSummaryColumnSelectorRuntimeScope = defaultMainUiSummaryColumnSelectorRuntimeScope
): MainUiSummaryColumnSelectorRuntime {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "main UI summary selector requires a document provider"
        );
    }
    if (typeof scope.getHTMLElement !== "function") {
        throw new TypeError(
            "main UI summary selector requires an HTMLElement provider"
        );
    }
    if (typeof scope.getSetTimeout !== "function") {
        throw new TypeError(
            "main UI summary selector requires a setTimeout provider"
        );
    }

    return {
        getSummaryGearButton(selector): HTMLElement | null {
            const element =
                scope.getDocument()?.querySelector(selector) ?? null;
            return isHTMLElement(scope, element) ? element : null;
        },
        getSummaryTab(id): HTMLElement | null {
            const documentTarget = scope.getDocument();
            if (!documentTarget) {
                return null;
            }

            const element = getElementByIdFlexible(documentTarget, id);
            return isHTMLElement(scope, element) ? element : null;
        },
        setTimeout(callback, delay): MainUiSummaryColumnSelectorTimer {
            const setTimeout = scope.getSetTimeout();
            if (typeof setTimeout !== "function") {
                throw new TypeError(
                    "main UI summary selector requires setTimeout"
                );
            }

            return setTimeout(callback, delay);
        },
    };
}
