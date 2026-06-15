export interface EnableTabButtonsDebugRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof clearTimeout | undefined;
    readonly getComputedStyle?:
        | ((element: Element, pseudoElement?: null | string) => CSSStyleDeclaration)
        | undefined;
    readonly setTimeout?: typeof setTimeout | undefined;
    readonly window?: unknown;
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

function getAbortControllerConstructor(
    scope: EnableTabButtonsDebugRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? getWindowAbortControllerConstructor(scope.window);
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getWindowAbortControllerConstructor(
    runtimeWindow: unknown
): typeof AbortController | undefined {
    if (typeof runtimeWindow !== "object" || runtimeWindow === null) {
        return undefined;
    }

    const AbortControllerConstructor: unknown = Reflect.get(
        runtimeWindow,
        "AbortController"
    );

    return isAbortControllerConstructor(AbortControllerConstructor)
        ? AbortControllerConstructor
        : undefined;
}

function isAbortControllerConstructor(
    value: unknown
): value is typeof AbortController {
    return typeof value === "function";
}

function getRequiredClearTimeout(
    scope: EnableTabButtonsDebugRuntimeScope
): typeof clearTimeout {
    const clearTimer = scope.clearTimeout;
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
    const scheduleTimer = scope.setTimeout;
    if (typeof scheduleTimer !== "function") {
        throw new TypeError(
            "enableTabButtonsDebug requires a setTimeout runtime"
        );
    }

    return scheduleTimer;
}

export function getEnableTabButtonsDebugRuntime(
    scope: EnableTabButtonsDebugRuntimeScope = globalThis
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
            if (
                scope.window === undefined ||
                typeof scope.getComputedStyle !== "function"
            ) {
                throw new TypeError("getComputedStyle not available");
            }

            scope.getComputedStyle(element);
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
