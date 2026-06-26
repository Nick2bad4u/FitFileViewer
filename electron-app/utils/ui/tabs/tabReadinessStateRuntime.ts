import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export interface TabReadinessStateRuntimeScope {
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
}

export interface TabReadinessStateRuntime {
    readonly now: () => number;
}

const defaultTabReadinessStateRuntimeScope: TabReadinessStateRuntimeScope = {
    getDateNow: getBrowserDateNow,
};

function getRequiredDateNow(
    scope: TabReadinessStateRuntimeScope
): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("tabReadinessState requires a date clock runtime");
    }

    return dateNow;
}

export function getTabReadinessStateRuntime(
    scope: TabReadinessStateRuntimeScope = defaultTabReadinessStateRuntimeScope
): TabReadinessStateRuntime {
    return {
        now(): number {
            return getRequiredDateNow(scope)();
        },
    };
}
