export interface ComputedStateManagerRuntimeScope {
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
}

export interface ComputedStateManagerRuntime {
    isDarkSchemePreferred: () => boolean;
}

const defaultComputedStateManagerRuntimeScope: ComputedStateManagerRuntimeScope =
    globalThis;

export function getComputedStateManagerRuntime(
    scope: ComputedStateManagerRuntimeScope = defaultComputedStateManagerRuntimeScope
): ComputedStateManagerRuntime {
    return {
        isDarkSchemePreferred(): boolean {
            return Boolean(
                scope.matchMedia?.("(prefers-color-scheme: dark)").matches
            );
        },
    };
}
