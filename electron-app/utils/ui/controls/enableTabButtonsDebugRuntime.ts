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

export interface EnableTabButtonsDebugRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getComputedStyleFunction?:
        | (() => EnableTabButtonsDebugGetComputedStyle | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
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

function getAbortControllerConstructor(
    scope: EnableTabButtonsDebugRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = scope.getAbortController?.();
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
    return scope.getComputedStyleFunction?.();
}

function isRendererScope(scope: EnableTabButtonsDebugRuntimeScope): boolean {
    return scope.isRendererScope?.() === true;
}

function getRequiredClearTimeout(
    scope: EnableTabButtonsDebugRuntimeScope
): BrowserClearTimeout {
    const clearTimer = scope.getClearTimeout?.();
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
    const scheduleTimer = scope.getSetTimeout?.();
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
