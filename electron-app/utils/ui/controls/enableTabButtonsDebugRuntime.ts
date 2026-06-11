export interface EnableTabButtonsDebugRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly getComputedStyle?:
        | ((element: Element, pseudoElement?: null | string) => CSSStyleDeclaration)
        | undefined;
    readonly window?: unknown;
}

export interface EnableTabButtonsDebugRuntime {
    createAbortController: () => AbortController;
    assertComputedStyleAvailable: (element: Element) => void;
}

function getAbortControllerConstructor(
    scope: EnableTabButtonsDebugRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ??
        getWindowAbortControllerConstructor(scope.window) ??
        globalThis.AbortController;
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

export function getEnableTabButtonsDebugRuntime(
    scope: EnableTabButtonsDebugRuntimeScope = globalThis
): EnableTabButtonsDebugRuntime {
    return {
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
    };
}
