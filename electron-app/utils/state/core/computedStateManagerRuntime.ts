export interface ComputedStateManagerRuntimeScope {
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
}

export interface ComputedStateManagerRuntime {
    isDarkSchemePreferred: () => boolean;
}

const defaultComputedStateManagerRuntimeScope: ComputedStateManagerRuntimeScope =
    {
        getMatchMedia: () => globalThis.matchMedia,
    };

export function getComputedStateManagerRuntime(
    scope: ComputedStateManagerRuntimeScope = defaultComputedStateManagerRuntimeScope
): ComputedStateManagerRuntime {
    return {
        isDarkSchemePreferred(): boolean {
            const matchMedia = scope.getMatchMedia?.();
            return Boolean(
                matchMedia?.("(prefers-color-scheme: dark)").matches
            );
        },
    };
}
