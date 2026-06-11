export interface EnableTabButtonsDebugRuntimeScope {
    readonly getComputedStyle?:
        | ((element: Element, pseudoElement?: null | string) => CSSStyleDeclaration)
        | undefined;
    readonly window?: unknown;
}

export interface EnableTabButtonsDebugRuntime {
    assertComputedStyleAvailable(element: Element): void;
}

export function getEnableTabButtonsDebugRuntime(
    scope: EnableTabButtonsDebugRuntimeScope = globalThis
): EnableTabButtonsDebugRuntime {
    return {
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
