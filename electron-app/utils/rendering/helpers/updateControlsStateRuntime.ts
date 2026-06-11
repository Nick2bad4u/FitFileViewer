export interface UpdateControlsStateRuntimeScope {
    readonly getComputedStyle?:
        | ((element: Element, pseudoElement?: null | string) => CSSStyleDeclaration)
        | undefined;
}

export interface UpdateControlsStateRuntime {
    getComputedDisplay(element: Element): string;
}

export function getUpdateControlsStateRuntime(
    scope: UpdateControlsStateRuntimeScope = globalThis
): UpdateControlsStateRuntime {
    return {
        getComputedDisplay(element: Element): string {
            return scope.getComputedStyle?.(element).display ?? "";
        },
    };
}
