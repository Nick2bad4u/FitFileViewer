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
    readonly getDocument: MainUiSummaryColumnSelectorRuntimeProvider<Document>;
    readonly getHTMLElement: MainUiSummaryColumnSelectorRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getSetTimeout: MainUiSummaryColumnSelectorRuntimeProvider<BrowserSetTimeout>;
}

type MainUiSummaryColumnSelectorRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

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
    getHTMLElement: () => BrowserHTMLElementConstructor | undefined,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = getHTMLElement();
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

export function getMainUiSummaryColumnSelectorRuntime(
    scope: MainUiSummaryColumnSelectorRuntimeScope = defaultMainUiSummaryColumnSelectorRuntimeScope
): MainUiSummaryColumnSelectorRuntime {
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getHTMLElement = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        getSummaryGearButton(selector): HTMLElement | null {
            const element = getDocument()?.querySelector(selector) ?? null;
            return isHTMLElement(getHTMLElement, element) ? element : null;
        },
        getSummaryTab(id): HTMLElement | null {
            const documentTarget = getDocument();
            if (!documentTarget) {
                return null;
            }

            const element = getElementByIdFlexible(documentTarget, id);
            return isHTMLElement(getHTMLElement, element) ? element : null;
        },
        setTimeout(callback, delay): MainUiSummaryColumnSelectorTimer {
            const setTimeout = getSetTimeout();
            if (typeof setTimeout !== "function") {
                throw new TypeError(
                    "main UI summary selector requires setTimeout"
                );
            }

            return setTimeout(callback, delay);
        },
    };
}

function getRequiredProvider<T>(
    provider: MainUiSummaryColumnSelectorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `main UI summary selector requires ${article} ${providerName} provider`
        );
    }

    return provider;
}
