export interface ComputedStateManagerRuntimeScope {
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
}

export interface ComputedStateManagerRuntime {
    isDarkSchemePreferred: () => boolean;
}

export function getComputedStateManagerRuntime(
    scope: ComputedStateManagerRuntimeScope = globalThis
): ComputedStateManagerRuntime {
    return {
        isDarkSchemePreferred(): boolean {
            return Boolean(
                scope.matchMedia?.("(prefers-color-scheme: dark)").matches
            );
        },
    };
}
