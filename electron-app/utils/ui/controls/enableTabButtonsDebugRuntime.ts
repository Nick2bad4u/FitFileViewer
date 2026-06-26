import {
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
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof clearTimeout | undefined)
        | undefined;
    readonly getComputedStyleFunction?:
        | (() => EnableTabButtonsDebugGetComputedStyle | undefined)
        | undefined;
    readonly getSetTimeout?: (() => typeof setTimeout | undefined) | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
}

export interface EnableTabButtonsDebugRuntime {
    readonly clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
    readonly createAbortController: () => AbortController;
    readonly assertComputedStyleAvailable: (element: Readonly<Element>) => void;
    readonly setTimeout: (
        handler: () => void,
        timeout: number
    ) => ReturnType<typeof setTimeout>;
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
): typeof AbortController {
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
): typeof clearTimeout {
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
): typeof setTimeout {
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
        clearTimeout(timer: ReturnType<typeof setTimeout>): void {
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
        setTimeout(
            handler: () => void,
            timeout: number
        ): ReturnType<typeof setTimeout> {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
