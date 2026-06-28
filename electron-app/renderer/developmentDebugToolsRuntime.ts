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

function readScopeValue(getValue: (() => unknown) | undefined): unknown {
    try {
        return getValue?.();
    } catch {
        return undefined;
    }
}

function isObject(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}

function getStringProperty(value: object, key: string): string | undefined {
    const property = (value as { readonly [propertyName: string]: unknown })[
        key
    ];
    return typeof property === "string" ? property : undefined;
}

function getNumberProperty(value: object, key: string): number | undefined {
    const property = (value as { readonly [propertyName: string]: unknown })[
        key
    ];
    return typeof property === "number" ? property : undefined;
}

function getBooleanProperty(value: object, key: string): boolean | undefined {
    const property = (value as { readonly [propertyName: string]: unknown })[
        key
    ];
    return typeof property === "boolean" ? property : undefined;
}

function getObjectProperty(value: object, key: string): object | undefined {
    const property = (value as { readonly [propertyName: string]: unknown })[
        key
    ];
    return isObject(property) ? property : undefined;
}

function toLocationSnapshot(
    value: unknown
): RendererDevelopmentLocationSnapshot {
    if (!isObject(value)) {
        return {};
    }

    const protocol = getStringProperty(value, "protocol");

    return protocol === undefined ? {} : { protocol };
}

function toNavigatorSnapshot(
    value: unknown
): RendererDevelopmentNavigatorSnapshot {
    if (!isObject(value)) {
        return {};
    }

    const cookieEnabled = getBooleanProperty(value, "cookieEnabled");
    const hardwareConcurrency = getNumberProperty(value, "hardwareConcurrency");
    const language = getStringProperty(value, "language");
    const onLine = getBooleanProperty(value, "onLine");
    const platform = getStringProperty(value, "platform");
    const userAgent = getStringProperty(value, "userAgent");

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
    if (!isObject(value)) {
        return {};
    }

    const memory = getObjectProperty(value, "memory");
    if (!memory) {
        return {};
    }

    const jsHeapSizeLimit = getNumberProperty(memory, "jsHeapSizeLimit");
    const totalJSHeapSize = getNumberProperty(memory, "totalJSHeapSize");
    const usedJSHeapSize = getNumberProperty(memory, "usedJSHeapSize");

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
