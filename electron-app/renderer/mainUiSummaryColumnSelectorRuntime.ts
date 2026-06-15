import { getElementByIdFlexible } from "../utils/ui/dom/elementIdUtils.js";

export type MainUiSummaryColumnSelectorTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface MainUiSummaryColumnSelectorRuntimeScope {
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout;
}

export interface MainUiSummaryColumnSelectorRuntime {
    getSummaryGearButton: (selector: string) => HTMLElement | null;
    getSummaryTab: (id: string) => HTMLElement | null;
    setTimeout: (
        callback: () => void,
        delay: number
    ) => MainUiSummaryColumnSelectorTimer;
}

function isHTMLElement(
    value: unknown,
    HTMLElementConstructor: typeof HTMLElement | undefined
): value is HTMLElement {
    return (
        typeof HTMLElementConstructor === "function" &&
        value instanceof HTMLElementConstructor
    );
}

export function getMainUiSummaryColumnSelectorRuntime(
    scope: MainUiSummaryColumnSelectorRuntimeScope = globalThis
): MainUiSummaryColumnSelectorRuntime {
    return {
        getSummaryGearButton(selector): HTMLElement | null {
            const element = scope.document?.querySelector(selector) ?? null;
            return isHTMLElement(element, scope.HTMLElement) ? element : null;
        },
        getSummaryTab(id): HTMLElement | null {
            const documentTarget = scope.document;
            if (!documentTarget) {
                return null;
            }

            const element = getElementByIdFlexible(documentTarget, id);
            return isHTMLElement(element, scope.HTMLElement) ? element : null;
        },
        setTimeout(callback, delay): MainUiSummaryColumnSelectorTimer {
            const setTimeout = scope.setTimeout;
            if (typeof setTimeout !== "function") {
                throw new TypeError(
                    "main UI summary selector requires setTimeout"
                );
            }

            return setTimeout(callback, delay);
        },
    };
}
