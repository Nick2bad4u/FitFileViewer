export interface UnifiedStateManagerRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
}

export interface UnifiedStateManagerRuntime {
    dateNow: () => number;
}

const defaultUnifiedStateManagerRuntimeScope: UnifiedStateManagerRuntimeScope =
    {
        getDateNow: () => Date.now,
    };

export function getUnifiedStateManagerRuntime(
    scope: UnifiedStateManagerRuntimeScope = defaultUnifiedStateManagerRuntimeScope
): UnifiedStateManagerRuntime {
    return {
        dateNow(): number {
            const dateNow = scope.getDateNow?.();
            if (typeof dateNow !== "function") {
                throw new TypeError("unifiedStateManager requires dateNow");
            }

            return dateNow();
        },
    };
}
