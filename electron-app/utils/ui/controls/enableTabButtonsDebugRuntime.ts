type EnableTabButtonsDebugGetComputedStyle = (
    element: Element,
    pseudoElement?: null | string
) => CSSStyleDeclaration;

export interface EnableTabButtonsDebugRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof clearTimeout | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof clearTimeout | undefined)
        | undefined;
    readonly getComputedStyle?:
        | EnableTabButtonsDebugGetComputedStyle
        | undefined;
    readonly getComputedStyleFunction?:
        | (() => EnableTabButtonsDebugGetComputedStyle | undefined)
        | undefined;
    readonly getSetTimeout?: (() => typeof setTimeout | undefined) | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
    readonly setTimeout?: typeof setTimeout | undefined;
}

export interface EnableTabButtonsDebugRuntime {
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
    createAbortController: () => AbortController;
    assertComputedStyleAvailable: (element: Element) => void;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => ReturnType<typeof setTimeout>;
}

const defaultEnableTabButtonsDebugRuntimeScope: EnableTabButtonsDebugRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getClearTimeout: () => globalThis.clearTimeout,
        getComputedStyleFunction: () => globalThis.getComputedStyle,
        getSetTimeout: () => globalThis.setTimeout,
        isRendererScope: () => globalThis.document !== undefined,
    };

function getAbortControllerConstructor(
    scope: EnableTabButtonsDebugRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ?? scope.AbortController;
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
    return scope.getComputedStyleFunction?.() ?? scope.getComputedStyle;
}

function isRendererScope(scope: EnableTabButtonsDebugRuntimeScope): boolean {
    return scope.isRendererScope?.() === true;
}

function getRequiredClearTimeout(
    scope: EnableTabButtonsDebugRuntimeScope
): typeof clearTimeout {
    const clearTimer = scope.getClearTimeout?.() ?? scope.clearTimeout;
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
    const scheduleTimer = scope.getSetTimeout?.() ?? scope.setTimeout;
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
        assertComputedStyleAvailable(element: Element): void {
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
