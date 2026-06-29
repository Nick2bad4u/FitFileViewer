import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export interface TabReadinessStateRuntimeScope {
    readonly getDateNow: TabReadinessStateRuntimeProvider<() => number>;
}

type TabReadinessStateRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface TabReadinessStateRuntime {
    readonly now: () => number;
}

const defaultTabReadinessStateRuntimeScope: TabReadinessStateRuntimeScope = {
    getDateNow: getBrowserDateNow,
};

function getRequiredDateNow(
    scope: TabReadinessStateRuntimeScope
): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "date clock")();
    if (typeof dateNow !== "function") {
        throw new TypeError("tabReadinessState requires a date clock runtime");
    }

    return dateNow;
}

function getRequiredProvider<T>(
    provider: TabReadinessStateRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `tabReadinessState requires a ${providerName} provider`
        );
    }

    return provider;
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
