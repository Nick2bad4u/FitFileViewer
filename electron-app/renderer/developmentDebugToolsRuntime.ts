export interface RendererDevelopmentDebugToolsRuntimeScope {
    readonly location?: unknown;
    readonly navigator?: unknown;
    readonly performance?: unknown;
}

export interface RendererDevelopmentDebugToolsRuntime {
    getLocationRecord: () => Record<string, unknown>;
    getNavigatorRecord: () => Record<string, unknown>;
    getPerformanceMemoryRecord: () => Record<string, unknown>;
}

function readScopeProperty(
    scope: RendererDevelopmentDebugToolsRuntimeScope,
    property: keyof RendererDevelopmentDebugToolsRuntimeScope
): unknown {
    try {
        return Reflect.get(scope, property);
    } catch {
        return undefined;
    }
}

function toRuntimeRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}

const defaultRendererDevelopmentDebugToolsRuntimeScope: RendererDevelopmentDebugToolsRuntimeScope =
    globalThis;

export function getRendererDevelopmentDebugToolsRuntime(
    scope: RendererDevelopmentDebugToolsRuntimeScope = defaultRendererDevelopmentDebugToolsRuntimeScope
): RendererDevelopmentDebugToolsRuntime {
    return {
        getLocationRecord(): Record<string, unknown> {
            return toRuntimeRecord(readScopeProperty(scope, "location"));
        },
        getNavigatorRecord(): Record<string, unknown> {
            return toRuntimeRecord(readScopeProperty(scope, "navigator"));
        },
        getPerformanceMemoryRecord(): Record<string, unknown> {
            return toRuntimeRecord(
                toRuntimeRecord(readScopeProperty(scope, "performance"))[
                    "memory"
                ]
            );
        },
    };
}
