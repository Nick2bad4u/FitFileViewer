export interface UpdateControlsStateRuntimeScope {
    readonly getComputedStyle?:
        | ((element: Element, pseudoElement?: null | string) => CSSStyleDeclaration)
        | undefined;
}

export interface UpdateControlsStateRuntime {
    getComputedDisplay(element: Element): string;
}

const defaultUpdateControlsStateRuntimeScope: UpdateControlsStateRuntimeScope =
    {
        get getComputedStyle() {
            return globalThis.getComputedStyle;
        },
    };

export function getUpdateControlsStateRuntime(
    scope: UpdateControlsStateRuntimeScope = defaultUpdateControlsStateRuntimeScope
): UpdateControlsStateRuntime {
    return {
        getComputedDisplay(element: Element): string {
            return scope.getComputedStyle?.(element).display ?? "";
        },
    };
}
