import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserComputedStyle,
    getBrowserDocument,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

type EnableTabButtonsDebugGetComputedStyle = (
    element: Readonly<Element>,
    pseudoElement?: null | string
) => CSSStyleDeclaration;
type EnableTabButtonsDebugRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface EnableTabButtonsDebugRuntimeScope {
    readonly getAbortController: EnableTabButtonsDebugRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: EnableTabButtonsDebugRuntimeProvider<BrowserClearTimeout>;
    readonly getComputedStyleFunction: EnableTabButtonsDebugRuntimeProvider<EnableTabButtonsDebugGetComputedStyle>;
    readonly getSetTimeout: EnableTabButtonsDebugRuntimeProvider<BrowserSetTimeout>;
    readonly isRendererScope: EnableTabButtonsDebugRuntimeProvider<boolean>;
}

export interface EnableTabButtonsDebugRuntime {
    readonly clearTimeout: (timer: BrowserTimerHandle) => void;
    readonly createAbortController: () => AbortController;
    readonly assertComputedStyleAvailable: (element: Readonly<Element>) => void;
    readonly setTimeout: (
        handler: () => void,
        timeout: number
    ) => BrowserTimerHandle;
}

const defaultEnableTabButtonsDebugRuntimeScope: EnableTabButtonsDebugRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getComputedStyleFunction: getBrowserComputedStyle,
        getSetTimeout: getBrowserSetTimeout,
        isRendererScope: () => getBrowserDocument() !== undefined,
    };

function getRequiredProvider<T>(
    provider: EnableTabButtonsDebugRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `enableTabButtonsDebug requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: EnableTabButtonsDebugRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getComputedStyleFunction(
    scope: EnableTabButtonsDebugRuntimeScope
): EnableTabButtonsDebugGetComputedStyle | undefined {
    return getRequiredProvider(
        scope.getComputedStyleFunction,
        "getComputedStyle"
    )();
}

function isRendererScope(scope: EnableTabButtonsDebugRuntimeScope): boolean {
    return (
        getRequiredProvider(scope.isRendererScope, "isRendererScope")() === true
    );
}

function getRequiredClearTimeout(
    scope: EnableTabButtonsDebugRuntimeScope
): BrowserClearTimeout {
    const clearTimer = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    )();
    if (typeof clearTimer !== "function") {
        throw new TypeError(
            "enableTabButtonsDebug requires a clearTimeout runtime"
        );
    }

    return clearTimer;
}

function getRequiredSetTimeout(
    scope: EnableTabButtonsDebugRuntimeScope
): BrowserSetTimeout {
    const scheduleTimer = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    )();
    if (typeof scheduleTimer !== "function") {
        throw new TypeError(
            "enableTabButtonsDebug requires a setTimeout runtime"
        );
    }

    return scheduleTimer;
}

export function getEnableTabButtonsDebugRuntime(
    scope: EnableTabButtonsDebugRuntimeScope = defaultEnableTabButtonsDebugRuntimeScope
): EnableTabButtonsDebugRuntime {
    return {
        clearTimeout(timer: BrowserTimerHandle): void {
            const clearTimer = getRequiredClearTimeout(scope);
            clearTimer(timer);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        assertComputedStyleAvailable(element: Readonly<Element>): void {
            const getComputedStyleRef = getComputedStyleFunction(scope);
            if (
                !isRendererScope(scope) ||
                typeof getComputedStyleRef !== "function"
            ) {
                throw new TypeError("getComputedStyle not available");
            }

            getComputedStyleRef(element);
        },
        setTimeout(handler: () => void, timeout: number): BrowserTimerHandle {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
