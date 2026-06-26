import {
    getBrowserLocation,
    getBrowserNavigator,
    getBrowserPerformance,
} from "../utils/runtime/browserRuntime.js";

export interface RendererDevelopmentDebugToolsRuntimeScope {
    readonly getLocation?: (() => unknown) | undefined;
    readonly getNavigator?: (() => unknown) | undefined;
    readonly getPerformance?: (() => unknown) | undefined;
}

export interface RendererDevelopmentDebugToolsRuntime {
    getLocationRecord: () => Record<string, unknown>;
    getNavigatorRecord: () => Record<string, unknown>;
    getPerformanceMemoryRecord: () => Record<string, unknown>;
}

function readScopeValue(getValue: (() => unknown) | undefined): unknown {
    try {
        return getValue?.();
    } catch {
        return undefined;
    }
}

function toRuntimeRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? Object.fromEntries(Object.entries(value))
        : {};
}

const defaultRendererDevelopmentDebugToolsRuntimeScope: RendererDevelopmentDebugToolsRuntimeScope =
    {
        getLocation: getBrowserLocation,
        getNavigator: getBrowserNavigator,
        getPerformance: getBrowserPerformance,
    };

export function getRendererDevelopmentDebugToolsRuntime(
    scope: RendererDevelopmentDebugToolsRuntimeScope = defaultRendererDevelopmentDebugToolsRuntimeScope
): RendererDevelopmentDebugToolsRuntime {
    return {
        getLocationRecord(): Record<string, unknown> {
            return toRuntimeRecord(readScopeValue(scope.getLocation));
        },
        getNavigatorRecord(): Record<string, unknown> {
            return toRuntimeRecord(readScopeValue(scope.getNavigator));
        },
        getPerformanceMemoryRecord(): Record<string, unknown> {
            return toRuntimeRecord(
                toRuntimeRecord(readScopeValue(scope.getPerformance))["memory"]
            );
        },
    };
}
