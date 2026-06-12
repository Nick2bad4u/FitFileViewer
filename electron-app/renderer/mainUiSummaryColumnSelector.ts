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

export interface MainUiSummaryColumnSelectorHandlerDependencies {
    readonly delay: number;
    readonly gearButtonSelector: string;
    readonly logMainUi: (
        level: "error" | "warn",
        message: string,
        ...args: unknown[]
    ) => void;
    readonly registerTimer: (
        timer: MainUiSummaryColumnSelectorTimer,
        options: { readonly owner: string }
    ) => unknown;
    readonly runtime?: MainUiSummaryColumnSelectorRuntime | undefined;
    readonly summaryTabId: string;
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

export function createMainUiSummaryColumnSelectorHandler({
    delay,
    gearButtonSelector,
    logMainUi,
    registerTimer,
    runtime = getMainUiSummaryColumnSelectorRuntime(),
    summaryTabId,
}: MainUiSummaryColumnSelectorHandlerDependencies): () => void {
    return () => {
        try {
            const summaryTab = runtime.getSummaryTab(summaryTabId);
            if (summaryTab && !summaryTab.classList.contains("active")) {
                summaryTab.click();
            }

            const summarySelectorTimer = runtime.setTimeout(() => {
                const gearButton =
                    runtime.getSummaryGearButton(gearButtonSelector);
                if (gearButton) {
                    gearButton.click();
                } else {
                    logMainUi("warn", "Summary gear button not found");
                }
            }, delay);

            registerTimer(summarySelectorTimer, {
                owner: "main-ui.summary-column-selector",
            });
        } catch (error) {
            logMainUi(
                "error",
                "Error handling summary column selector:",
                error
            );
        }
    };
}
