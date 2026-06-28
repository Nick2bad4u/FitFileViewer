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

export type RendererDevelopmentLocationSnapshot = Readonly<{
    readonly protocol?: string | undefined;
}>;

export type RendererDevelopmentNavigatorSnapshot = Readonly<{
    readonly cookieEnabled?: boolean | undefined;
    readonly hardwareConcurrency?: number | undefined;
    readonly language?: string | undefined;
    readonly onLine?: boolean | undefined;
    readonly platform?: string | undefined;
    readonly userAgent?: string | undefined;
}>;

export type RendererDevelopmentPerformanceMemorySnapshot = Readonly<{
    readonly jsHeapSizeLimit?: number | undefined;
    readonly totalJSHeapSize?: number | undefined;
    readonly usedJSHeapSize?: number | undefined;
}>;

export interface RendererDevelopmentDebugToolsRuntime {
    getLocationSnapshot: () => RendererDevelopmentLocationSnapshot;
    getNavigatorSnapshot: () => RendererDevelopmentNavigatorSnapshot;
    getPerformanceMemorySnapshot: () => RendererDevelopmentPerformanceMemorySnapshot;
}

type RendererDevelopmentLocationCandidate = Readonly<{
    readonly protocol?: unknown;
}>;

type RendererDevelopmentNavigatorCandidate = Readonly<{
    readonly cookieEnabled?: unknown;
    readonly hardwareConcurrency?: unknown;
    readonly language?: unknown;
    readonly onLine?: unknown;
    readonly platform?: unknown;
    readonly userAgent?: unknown;
}>;

type RendererDevelopmentPerformanceCandidate = Readonly<{
    readonly memory?: unknown;
}>;

type RendererDevelopmentPerformanceMemoryCandidate = Readonly<{
    readonly jsHeapSizeLimit?: unknown;
    readonly totalJSHeapSize?: unknown;
    readonly usedJSHeapSize?: unknown;
}>;

function readScopeValue(getValue: (() => unknown) | undefined): unknown {
    try {
        return getValue?.();
    } catch {
        return undefined;
    }
}

function isObjectCandidate(value: unknown): value is object {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toLocationCandidate(
    value: unknown
): RendererDevelopmentLocationCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function toNavigatorCandidate(
    value: unknown
): RendererDevelopmentNavigatorCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function toPerformanceCandidate(
    value: unknown
): RendererDevelopmentPerformanceCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function toPerformanceMemoryCandidate(
    value: unknown
): RendererDevelopmentPerformanceMemoryCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function getStringProperty(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function getNumberProperty(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
}

function getBooleanProperty(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function toLocationSnapshot(
    value: unknown
): RendererDevelopmentLocationSnapshot {
    const location = toLocationCandidate(value);
    if (location === undefined) {
        return {};
    }

    const protocol = getStringProperty(location.protocol);

    return protocol === undefined ? {} : { protocol };
}

function toNavigatorSnapshot(
    value: unknown
): RendererDevelopmentNavigatorSnapshot {
    const navigator = toNavigatorCandidate(value);
    if (navigator === undefined) {
        return {};
    }

    const cookieEnabled = getBooleanProperty(navigator.cookieEnabled);
    const hardwareConcurrency = getNumberProperty(
        navigator.hardwareConcurrency
    );
    const language = getStringProperty(navigator.language);
    const onLine = getBooleanProperty(navigator.onLine);
    const platform = getStringProperty(navigator.platform);
    const userAgent = getStringProperty(navigator.userAgent);

    return {
        ...(cookieEnabled === undefined ? {} : { cookieEnabled }),
        ...(hardwareConcurrency === undefined ? {} : { hardwareConcurrency }),
        ...(language === undefined ? {} : { language }),
        ...(onLine === undefined ? {} : { onLine }),
        ...(platform === undefined ? {} : { platform }),
        ...(userAgent === undefined ? {} : { userAgent }),
    };
}

function toPerformanceMemorySnapshot(
    value: unknown
): RendererDevelopmentPerformanceMemorySnapshot {
    const performance = toPerformanceCandidate(value);
    if (performance === undefined) {
        return {};
    }

    const memory = toPerformanceMemoryCandidate(performance.memory);
    if (memory === undefined) {
        return {};
    }

    const jsHeapSizeLimit = getNumberProperty(memory.jsHeapSizeLimit);
    const totalJSHeapSize = getNumberProperty(memory.totalJSHeapSize);
    const usedJSHeapSize = getNumberProperty(memory.usedJSHeapSize);

    return {
        ...(jsHeapSizeLimit === undefined ? {} : { jsHeapSizeLimit }),
        ...(totalJSHeapSize === undefined ? {} : { totalJSHeapSize }),
        ...(usedJSHeapSize === undefined ? {} : { usedJSHeapSize }),
    };
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
        getLocationSnapshot(): RendererDevelopmentLocationSnapshot {
            return toLocationSnapshot(readScopeValue(scope.getLocation));
        },
        getNavigatorSnapshot(): RendererDevelopmentNavigatorSnapshot {
            return toNavigatorSnapshot(readScopeValue(scope.getNavigator));
        },
        getPerformanceMemorySnapshot(): RendererDevelopmentPerformanceMemorySnapshot {
            return toPerformanceMemorySnapshot(
                readScopeValue(scope.getPerformance)
            );
        },
    };
}
